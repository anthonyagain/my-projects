defmodule MeldChatWeb.LayoutHelpers do
  def nav_links do
    [
      %{url: "/", text: "Home"},
      # %{url: "/app/", text: "App"},
    ]
  end

  def footer_links do
    [
      %{url: "/", text: "Home"},
      %{url: "/app/", text: "App"},
      %{url: "/privacy-policy/", text: "Privacy Policy"},
      %{url: "/terms-of-service/", text: "Terms of Service"},
    ]
  end
end
