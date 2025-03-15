defmodule MeldChatWeb.Router do

  use Phoenix.Router, helpers: false

  # Import common connection and controller functions to use in pipelines
  import Plug.Conn
  import Phoenix.Controller
  import Phoenix.LiveView.Router

  defp trailing_slash_redirect(conn, _opts) do
    case conn.path_info do
      [] -> conn
      path_parts ->
        path = "/" <> Enum.join(path_parts, "/")
        case String.ends_with?(conn.request_path, "/") do
          true -> conn
          false ->
            path_with_slash = path <> "/"
            query_string = if conn.query_string != "", do: "?" <> conn.query_string, else: ""
            conn
              |> redirect(to: path_with_slash <> query_string)
              |> halt()
        end
    end
  end

  # plugs for routes that return pages
  pipeline :browser do
    plug :accepts, ["html"]
    # plug :fetch_live_flash
    plug :fetch_session # phoenix's internal session, which is separate from our session, i guess
    plug :put_root_layout, html: {MeldChatWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  # plugs for all routes
  pipeline :general do
    plug :trailing_slash_redirect
    # get or create the session and store it on the conn
    plug MeldChatWeb.SessionPlug
    # if session is logged in, get the user object, or leave as nil
    plug MeldChatWeb.UserPlug
  end

  # plugs for api routes
  pipeline :api do
    plug :accepts, ["json"]
  end

  # plugs for admin-only routes
  pipeline :require_admin do
    # plug MeldChatWeb.RequireAdminPlug
  end

  # user-facing page routes
  scope "/", MeldChatWeb do
    pipe_through :general
    pipe_through :browser

    # routes list
    get "/", HomeController, :get
    get "/privacy-policy/", PrivacyPolicyController, :get
    get "/terms-of-service/", TermsOfServiceController, :get
  end

  # user-facing API routes
  scope "/api/v1", MeldChatWeb do
    pipe_through :general
    pipe_through :api

    # public API routes
    get "/profile", UserController, :get_profile
    post "/register", UserController, :create
    # post "/login", SessionController, :create
    # delete "/logout", SessionController, :delete
  end

  # admin-only page routes
  scope "/helm", MeldChatWeb do
    pipe_through :general
    pipe_through :require_admin

    # TODO admin pages
  end

  # admin-only API routes
  scope "/api/admin", MeldChatWeb do
    pipe_through :general
    pipe_through :require_admin

    # get "/users/search", UserController, :search
    # delete "/users/:id", UserController, :delete
  end


  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:meldchat, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: MeldChatWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
