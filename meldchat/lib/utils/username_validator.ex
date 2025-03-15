defmodule MeldChat.Utils.UsernameValidator do
  def valid?(username) when is_binary(username) do
    validate(username) == :ok
  end
  def valid?(_), do: false

  def validate(username) when is_binary(username) do
    allowed_chars = ~c"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"

    cond do
      username == "" ->
        {:error, "Username is required."}
      String.length(username) < 3 ->
        {:error, "Username must be at least 3 characters long."}
      String.length(username) > 30 ->
        {:error, "Username must be at most 30 characters long."}
      String.starts_with?(username, ["_", "-"]) ->
        {:error, "Username cannot start with underscore or hyphen."}
      String.ends_with?(username, ["_", "-"]) ->
        {:error, "Username cannot end with underscore or hyphen."}
      String.contains?(username, "__") ->
        {:error, "Username cannot contain consecutive underscores."}
      String.contains?(username, "--") ->
        {:error, "Username cannot contain consecutive hyphens."}
      not (String.to_charlist(username) |> Enum.all?(fn char -> char in allowed_chars end)) ->
        {:error, "Username can only contain letters, numbers, underscores, and hyphens."}
      true ->
        :ok
    end
  end
  def validate(_), do: {:error, "Invalid username."}
end
