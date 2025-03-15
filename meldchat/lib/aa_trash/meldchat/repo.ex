defmodule MeldChat.Repo do
  use Ecto.Repo,
    otp_app: :meldchat,
    adapter: Ecto.Adapters.Postgres
end
