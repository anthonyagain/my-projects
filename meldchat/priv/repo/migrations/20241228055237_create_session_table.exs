defmodule MeldChat.Repo.Migrations.CreateSessionTable do
  use Ecto.Migration

  def change do
      create table(:sessions) do
        add :session_id, :string, null: false
        add :data, :map
        add :expires_at, :utc_datetime

        timestamps()
      end

      create unique_index(:sessions, [:session_id])
    end
end
