# we use this because i dont like regexes (they are bad - slow and unreadable)
defmodule MeldChat.Utils.EmailValidator do
  def valid?(email) when is_binary(email) do
    case String.split(email, "@") do
      [local, domain] ->
        local_chars = ~c"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!#$%&'*+-/=?^_`{|}~"
        domain_chars = ~c"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-"

        local != "" and
        String.length(local) <= 64 and
        not String.starts_with?(local, ".") and
        not String.ends_with?(local, ".") and
        not String.contains?(local, "..") and
        String.to_charlist(local) |> Enum.all?(fn char -> char in local_chars end) and

        domain != "" and
        String.contains?(domain, ".") and
        String.length(List.last(String.split(domain, "."))) >= 2 and
        not String.starts_with?(domain, ["-", "."]) and
        not String.ends_with?(domain, ["-", "."]) and
        not String.contains?(domain, "..") and
        not String.contains?(domain, "--") and
        String.to_charlist(domain) |> Enum.all?(fn char -> char in domain_chars end)
      _ -> false
    end
  end
  def valid?(_), do: false
end
