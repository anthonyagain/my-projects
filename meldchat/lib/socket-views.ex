# TODO: start in this file. add an 'endpoint' for retrieving profile data

defmodule MeldChatWeb.PingChannel do
  use Phoenix.Channel

  def join("ping", _payload, socket) do
    {:ok, socket}
  end

  # Handle incoming "ping" events
  def handle_in("ping", _payload, socket) do
    {:reply, {:ok, %{message: "pong"}}, socket}
  end
end


defmodule MeldChatWeb.UserSocket do
  use Phoenix.Socket

  channel "ping", MeldChatWeb.PingChannel

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end
