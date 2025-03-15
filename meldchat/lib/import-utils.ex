defmodule MeldChatWeb.Utils do
  @moduledoc """

  (my description):

  This file contains utility functions that can be called by other code/functions
  in our project to inject code into them at the top - mainly to inject a bunch of imports
  that we want to commonly use in that particular (type of) scope.

  For example, Phoenix mandates at gunpoint that your app uses a Controller and then a View
  in the rendering pipeline of a particular URL/endpoint.


  (generated text below):

  The entrypoint for defining your web interface, such
  as controllers, components, channels, and so on.

  This can be used in your application as:

      use HelloWeb, :controller
      use HelloWeb, :html

  The definitions below will be executed for every controller,
  component, etc, so keep them short and clean, focused
  on imports, uses and aliases.

  Do NOT define functions inside the quoted expressions
  below. Instead, define additional modules and import
  those modules here.
  """

  # everything under priv/static/ is static files and should be served
  # static_dirs tells the path verifier what paths are valid static files,
  # while static_paths tells the static file server what directories/files to serve within /static
  def static_dirs, do: ~w(static)
  def static_paths do
    "priv/static"
    |> File.ls!()
    |> Enum.filter(fn file ->
      Path.join("priv/static", file)
      |> File.dir?()
    end)
  end

  def router do
    quote do
      use Phoenix.Router, helpers: false

      # Import common connection and controller functions to use in pipelines
      import Plug.Conn
      import Phoenix.Controller
      import Phoenix.LiveView.Router
    end
  end

  def channel do
    quote do
      use Phoenix.Channel
    end
  end

  def controller do
    quote do
      use Phoenix.Controller,
        formats: [:html, :json],
        layouts: [html: MeldChatWeb.Layouts]

      import Plug.Conn

      unquote(verified_routes())
    end
  end

  def live_view do
    quote do
      use Phoenix.LiveView,
        layout: {MeldChat.Layouts, :app}

      unquote(html_helpers())
    end
  end

  def live_component do
    quote do
      use Phoenix.LiveComponent

      unquote(html_helpers())
    end
  end

  def html do
    quote do
      use Phoenix.Component
      import MeldChatWeb.Components

      # Import convenience functions from controllers
      import Phoenix.Controller,
        only: [get_csrf_token: 0, view_module: 1, view_template: 1]

      # Include general helpers for rendering HTML
      unquote(html_helpers())
    end
  end

  defp html_helpers do
    quote do
      # HTML escaping functionality
      import Phoenix.HTML
      # Core UI components and translation
      # import HelloWeb.CoreComponents
      # import HelloWeb.Gettext

      # Shortcut for generating JS commands
      alias Phoenix.LiveView.JS

      # Routes generation with the ~p sigil
      unquote(verified_routes())
    end
  end

  def verified_routes do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: MeldChatWeb.Endpoint,
        router: MeldChatWeb.Router,
        statics: MeldChatWeb.Utils.static_dirs()
    end
  end


  @doc """
  When used, dispatch to the appropriate controller/live_view/etc.
  """
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
