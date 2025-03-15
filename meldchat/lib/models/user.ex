defmodule MeldChat.User do
  use Ecto.Schema

  @doc """
    plan: we are going to make all string fields be null=false, and use
    an empty string as the null value instead; same as in django.
  """
  schema "users" do
    field :email, :string # nullable: false, unique: true
    field :email_verified_at, :utc_datetime # nullable: true
    field :password_hash, :string # nullable: false
    field :date_of_birth, :date # nullable: false

    field :username, :string # nullable: false, unique: true
    field :display_name, :string, default: "" # nullable: false
    field :bio, :string, default: "" # nullable: false

    field :profile_image_path, :string # nullable: true
    # 's3', or the name of the server its on
    field :profile_image_system, :string # nullable: true

    field :last_seen_at, :utc_datetime # nullable: false

    field :is_superuser, :boolean, default: false # nullable: false

    field :global_banned_at, :utc_datetime # nullable: true
    field :global_banned_reason, :string, default: "" # nullable: false
    belongs_to :global_banned_by, MeldChat.User # nullable: true

    timestamps(type: :utc_datetime) # nullable: false
  end
end


# module containing business logic for the 'User' table and related utilities
defmodule MeldChat.UserManager do
  import Ecto.Changeset
  alias MeldChat.{Repo, User}
  import Ecto.Query
  require Timex

  @default_page_size 20


  def get_user(id) do
    Repo.get(User, id)
  end

  def create_user(attrs) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    password = Map.get(attrs, "password")

    # Start with base changeset
    changeset = %User{}
      |> cast(attrs, [
        :email,
        :email_verified_at,
        :username,
        :display_name,
        :bio,
        :profile_image_path,
        :profile_image_system,
        :last_seen_at,
        :is_superuser
      ])


    IO.inspect(Map.get(attrs, "date_of_birth"), label: "Date of Birth")


    # Handle date parsing
    changeset = case Map.get(attrs, "date_of_birth") do
      date_string when is_binary(date_string) ->
        try do
          # have to put dashes inside the elements here in order to parse with or without leading zeros
          # (without them, it errors if no leading zeros.)
          date = date_string |> Timex.parse!("%-Y-%-m-%-d", :strftime) |> Timex.to_date()
          put_change(changeset, :date_of_birth, date)
        rescue
          _ -> add_error(changeset, :date_of_birth, "Invalid date of birth.")
        end
      nil ->
        add_error(changeset, :date_of_birth, "Date of birth is required.")
      _ ->
        add_error(changeset, :date_of_birth, "Invalid date of birth.")
    end

    changeset
      # required values
      |> validate_required([
        :email,
        :username,
        :display_name,
        :date_of_birth
      ])
      # clean the data
      |> put_change(:last_seen_at, now)
      |> update_change(:email, &String.trim/1)
      |> update_change(:username, &String.trim/1)
      |> update_change(:display_name, &String.trim/1)
      |> update_change(:bio, &String.trim/1)
      |> update_change(:global_banned_reason, &String.trim/1)
      # validations
      |> validate_email(:email)
      |> validate_username(:username)
      |> validate_date_of_birth(:date_of_birth)
      |> update_change(:email, &String.downcase/1)
      |> update_change(:username, &String.downcase/1)
      |> validate_length(:display_name, max: 32)
      |> validate_length(:bio, max: 500)
      # TODO - if row insertion fails, image should be deleted?
      |> validate_length(:profile_image_path, max: 1000)
      |> validate_inclusion(:profile_image_system, ["s3", "local"])

      # these tell the changeset that there is a unique constraint on these
      # fields in the DB, and if the DB throws a uniqueness error, it gets
      # automatically caught and converted to an error here which is returned.
      |> unique_constraint(:email, message: "Email is already in use.")
      |> unique_constraint(:username, message: "Username not available.")
      |> validate_and_hash_password(password)
      |> Repo.insert()
  end

  # util function for user creation
  defp validate_and_hash_password(changeset, password) do
    cond do
      is_nil(password) ->
        add_error(changeset, :password, "Password is required.")

      String.length(password) < 6 ->
        add_error(changeset, :password, "Password must be at least 6 characters")

      String.length(password) > 72 ->
        add_error(changeset, :password, "Password must be at most 72 characters")

      true ->
        change(changeset, password_hash: Bcrypt.hash_pwd_salt(password))
    end
  end

  # util function for user creation
  defp validate_email(changeset, field) do
    case get_change(changeset, field) do
      nil -> changeset
      email ->
        if MeldChat.Utils.EmailValidator.valid?(email) do
          changeset
        else
          add_error(changeset, field, "Must be a valid email address")
        end
    end
  end

  # util function for user creation
  defp validate_username(changeset, field) do
    case get_change(changeset, field) do
      nil -> changeset
      username ->
        case MeldChat.Utils.UsernameValidator.validate(username) do
          :ok -> changeset
          {:error, reason} -> add_error(changeset, field, reason)
        end
    end
  end

  # util function for user creation
  defp validate_date_of_birth(changeset, field) do
    changeset
      |> validate_change(field, fn _, dob ->
        case dob do
          nil ->
            [{field, "must not be empty"}]
          date ->
            today = Date.utc_today()
            age = Date.diff(today, date) / 365.25

            cond do
              Date.compare(date, today) == :gt ->
                [{field, "cannot be in the future"}]
              age < 13 ->
                [{field, "must be at least 13 years old"}]
              age > 120 ->
                [{field, "invalid date of birth"}]
              true ->
                []
            end
        end
      end)
  end




  # other user functions
  def authenticate_user(email, password) do
    user = Repo.get_by(User, email: String.downcase(email))

    case user do
      nil -> {:error, "Invalid email or password"}
      %{global_banned_at: banned_at} when not is_nil(banned_at) ->
        {:error, "Account has been banned."}
      user ->
        if Bcrypt.verify_pass(password, user.password_hash) do
          {:ok, user}
        else
          {:error, "Invalid email or password"}
        end
    end
  end

  def get_user_profile(user_id) when is_nil(user_id), do: nil
  def get_user_profile(user_id) do
    case Repo.get(User, user_id) do
      nil -> nil
      user ->
        # Using Map.from_struct and Map.drop to remove sensitive/internal fields
        user
          |> Map.from_struct()
          |> Map.drop([
            :password_hash,
            :is_superuser,
            :global_banned_by_id,
            :__meta__  # Remove Ecto metadata
          ])
    end
  end

  def update_email(user, email) do
    user
      |> cast(%{email: email}, [:email])
      |> update_change(:email, &String.trim/1)
      |> validate_email(:email)
      |> update_change(:email, &String.downcase/1)
      |> unique_constraint(:email)
      |> put_change(:email_verified_at, nil)
      |> Repo.update()
  end

  def update_username(user, username) do
    user
      |> cast(%{username: username}, [:username])
      |> update_change(:username, &String.trim/1)
      |> validate_username(:username)
      |> update_change(:username, &String.downcase/1)
      |> unique_constraint(:username)
      |> Repo.update()
  end

  def update_display_name(user, display_name) do
    user
      |> cast(%{display_name: display_name}, [:display_name])
      |> update_change(:display_name, &String.trim/1)
      |> validate_length(:display_name, max: 32)
      |> Repo.update()
  end

  def update_password(user, password) do
    user
      |> change()
      |> validate_and_hash_password(password)
      |> Repo.update()
  end

  def update_bio(user, bio) do
    user
      |> cast(%{bio: bio}, [:bio])
      |> update_change(:bio, &String.trim/1)
      |> validate_length(:bio, max: 500)
      |> Repo.update()
  end

  def update_profile_image(user, path, system) do
    user
      |> cast(%{
        profile_image_path: path,
        profile_image_system: system
      }, [:profile_image_path, :profile_image_system])
      |> validate_length(:profile_image_path, max: 1000)
      |> validate_inclusion(:profile_image_system, ["s3", "local"])
      |> Repo.update()
  end

  def update_last_seen_at(user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    user
      |> change(last_seen_at: now)
      |> Repo.update()
  end

  # accessible by admin only; mostly only used for dev testing stuff
  def delete_user(user) do
    Repo.delete(user)
  end

  # accessible by admin only
  def global_ban_user(user, %{banned_by_id: banner_id, reason: reason}) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    user
      |> change(%{
        global_banned_at: now,
        global_banned_reason: reason,
        global_banned_by_id: banner_id
      })
      |> Repo.update()
  end

  def global_unban_user(user) do
    user
      |> change(%{
        global_banned_at: nil,
        global_banned_reason: nil,
        global_banned_by_id: nil
      })
      |> Repo.update()
  end

  def globally_banned?(%User{global_banned_at: nil}), do: false
  def globally_banned?(%User{}), do: true

  def get_global_ban_info(user) do
    user = Repo.preload(user, :global_banned_by)
    case user.global_banned_at do
      nil -> nil
      _ -> %{
        banned_at: user.global_banned_at,
        reason: user.global_banned_reason,
        banned_by: user.global_banned_by
      }
    end
  end


  # queries for users (these should be accessible by admin only)

  def list_users(cursor \\ nil, limit \\ @default_page_size) do
    base_query = from(u in User, order_by: [desc: u.id])

    query = if cursor, do: where(base_query, [u], u.id < ^cursor), else: base_query

    query
      |> limit(^limit)
      |> Repo.all()
  end

  def search_users(search_term, settings, cursor \\ nil, limit \\ @default_page_size) do
    search_term = "%#{search_term}%"

    base_query = from(u in User)

    query =
      Enum.reduce(settings, base_query, fn
        {:search_username, true}, query ->
          or_where(query, [u], ilike(u.username, ^search_term))

        {:search_email, true}, query ->
          or_where(query, [u], ilike(u.email, ^search_term))

        {:search_display_name, true}, query ->
          or_where(query, [u], ilike(u.display_name, ^search_term))

        _, query ->
          query
      end)

    query = if cursor, do: where(query, [u], u.id < ^cursor), else: query

    query
      |> order_by([u], [desc: u.id])
      |> limit(^limit)
      |> Repo.all()
  end
end
