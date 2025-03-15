from django.conf import settings

def cors_middleware(get_response):
    """
    Custom middleware that allows for cross-origin requests. This only gets
    used in development, so that we can run the react development server alongside
    the Django webserver without having to repeatedly re-compile the React app,
    so there aren't any security issues caused by this.

    https://stackoverflow.com/a/35761458/11821189
    """

    def middleware(request):
        if settings.DEBUG == True:
            response = get_response(request)

            response["Access-Control-Allow-Origin"] = "http://localhost:3000"
            response["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept"
            response["Access-Control-Allow-Credentials"] = "true"

            return response

    return middleware
