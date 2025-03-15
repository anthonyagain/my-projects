from django.urls import path, re_path
from .views import RenderReact, JoinGameEvent, ValidateJoinGameEvent, ExitGameEvent

urlpatterns = [
    re_path(r'join-game/.*', JoinGameEvent.as_view()),
    re_path(r'rust/join-game-event/.*', ValidateJoinGameEvent.as_view()),
    re_path(r'rust/exit-game-event/.*', ExitGameEvent.as_view()),
    re_path(r'.*', RenderReact.as_view()),
]
