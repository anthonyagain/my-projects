# controller and view for the homepage
defmodule MeldChatWeb.HomeController do
  use MeldChatWeb.Utils, :controller

  def get(conn, _params) do

    IO.puts("made it to get, Phoenix!")


    conn
      # set the html page title
      |> assign(:page_title, "MeldChat Home")
      |> render(:home)
  end
end

defmodule MeldChatWeb.HomeHTML do
  @moduledoc """
  This module contains pages rendered by PageController.

  See the `page_html` directory for all templates available.
  """
  use MeldChatWeb.Utils, :html

  embed_templates "../../templates/pages/**/*"
end
