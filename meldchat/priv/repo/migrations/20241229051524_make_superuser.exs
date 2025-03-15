defmodule MeldChat.Repo.Migrations.MakeSuperuser do
  use Ecto.Migration
  alias MeldChat.{UserManager}

  def change do
    # Get superuser credentials from environment variables or use defaults
    email = System.get_env("SUPERUSER_EMAIL") || "admin@meldchat.com"
    username = System.get_env("SUPERUSER_USERNAME") || "admin"
    password = System.get_env("SUPERUSER_PASSWORD") || "admin123"

    now = DateTime.utc_now() |> DateTime.truncate(:second)

    # Create the superuser
    execute fn ->
      case UserManager.create_user(%{
        "email" => email,
        "username" => username,
        "password" => password,
        "password_confirmation" => password,
        "display_name" => "Admin",
        "date_of_birth" => ~D[2000-01-01],
        "is_superuser" => true,
        "email_verified_at" => now,
        "last_seen_at" => now
      }) do
        {:ok, _user} ->
          IO.puts """
          Superuser created successfully:
          Email: #{email}
          Username: #{username}
          Password: #{password}
          """
        {:error, changeset} ->
          IO.puts "Failed to create superuser:"
          IO.inspect changeset.errors
      end
    end
  end
end
