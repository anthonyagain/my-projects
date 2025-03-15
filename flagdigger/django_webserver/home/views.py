from django.shortcuts import render
from django.views import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.conf import settings

from .models import GameServer, Room, PlayerGameSession

import random


class RenderReact(View):
    def get(self, request):
        return render(request, "index.html")


def decide_room_to_assign():
    """
    Decide what room to assign a new player to. This logic will evolve as our
    game grows.

    Returns a Room object.
    """
    server, _ = GameServer.objects.get_or_create(server_ip="45.33.83.104")
    room, _ = Room.objects.get_or_create(server=server)

    return room


class JoinGameEvent(View):
    """ See 'Player' model docstring """
    def get(self, request):
        """
        Force create a session and set cookie on user's browser for it - cookie
        has format "sessionid": [value], where value is the same value accessible
        via request.session.session_key.
        """
        if not request.session.exists(request.session.session_key):
            request.session.create()

        name = request.GET.get('name', None)
        if not name:
            name = "Guest" + str(random.randint(1000, 9999))

        assigned_room = decide_room_to_assign()

        new_player = PlayerGameSession.objects.create(
            room=assigned_room,
            name=name,
            session_cookie=request.session.session_key,
            state=PlayerGameSession.PENDING
        )

        if settings.DEBUG == True:
            server_ip = "localhost:5000"
        else:
            server_ip = new_player.room.server.server_ip

        return JsonResponse({
            "server_ip": server_ip,
            "socket_id": new_player.pk,
            "room_id": new_player.room.pk
        })


class ValidateJoinGameEvent(View):
    """ See 'Player' model docstring """

    def get(self, request):

        # if request doesn't have the secret key, pretend this view doesn't exist
        if request.GET.get("secret_key", None) != settings.SERVER_COMMUNICATION_SECRET_KEY:
            return RenderReact.as_view()(request)

        session_cookie = request.GET.get("cookie", None)
        player_name = request.GET.get("name", None)
        room_id = request.GET.get("room_id", None)

        # if request is missing args, raise an error
        if not session_cookie or not player_name or not room_id:
            return HttpResponseBadRequest("Missing arguments.")

        player = PlayerGameSession.objects.filter(
            session_cookie=session_cookie,
            name=name,
            room=Room.objects.filter(pk=room_id).first(),
            state=PlayerGameSession.PENDING
        ).first()

        # if a matching player was not found, aka a user tried to connect in a cheaty way, raise an error
        if not player:
            return HttpResponseBadRequest("Player not found.")

        # all is good - update state to IN_GAME and tell rust we are clear to add
        # the player to the game, and give rust the player session PK for later use
        player.state = player.IN_GAME
        player.save()
        return JsonResponse({
            "player_session_id": player.pk
        })


class ExitGameEvent(View):
    """ See 'Player' model docstring """

    def get(self, request):
        # TODO: get secret_key out of request, validate that this is from rust server, then continue
        #
        # TODO: get player pk out of request, delete player by pk, return OK
        pass
































#
