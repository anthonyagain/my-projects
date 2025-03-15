defmodule MeldChat.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :email, :string, null: false
      add :email_verified_at, :utc_datetime
      add :password_hash, :string, null: false
      add :date_of_birth, :date, null: false

      add :username, :string, null: false
      add :display_name, :string, null: false, default: ""
      add :bio, :string, null: false, default: ""

      add :profile_image_path, :string
      add :profile_image_system, :string

      add :last_seen_at, :utc_datetime, null: false

      add :is_superuser, :boolean, null: false, default: false

      add :global_banned_at, :utc_datetime
      add :global_banned_reason, :string, null: false, default: ""
      add :global_banned_by_id, references(:users, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    # Create unique indexes
    create unique_index(:users, [:email])
    create unique_index(:users, [:username])
  end
end
