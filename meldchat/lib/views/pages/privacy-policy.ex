defmodule MeldChatWeb.PrivacyPolicyController do
  use MeldChatWeb.Utils, :controller

  def get(conn, _params) do
    conn
      # set the html page title
      |> assign(:page_title, "MeldChat Privacy Policy")
      |> render("privacy-policy.html")
  end
end

defmodule MeldChatWeb.PrivacyPolicyHTML do
  @moduledoc """
  This module contains pages rendered by PageController.

  See the `page_html` directory for all templates available.
  """
  use MeldChatWeb.Utils, :html

  embed_templates "../templates/pages/**/*"
end
