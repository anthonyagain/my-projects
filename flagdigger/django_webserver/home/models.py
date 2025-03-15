from django.db import models
from django.utils import timezone
from django.conf import settings

# Create your models here.

class GameServer(models.Model):
    """
    Represents a server/machine that is currently running the Rust game server
    and accepting incoming websocket connections.

    Each server runs a single Rust process (that may spawn a number of sub-processes).
    """
    server_ip = models.CharField(max_length=100, null=False, blank=False)
    default = models.BooleanField(default=False)

class Room(models.Model):
    """
    Represents a game room. Rust processes will spawn child processes, each of
    which will handle a single room (or a number of rooms, if we decide to
    make the max players per room very small)
    """
    server = models.ForeignKey(GameServer, on_delete=models.PROTECT, null=False)

class PlayerGameSession(models.Model):
    """
    Object storing data for a single "game session" for a single player in a room.
    This object gets deleted when the player leaves the game/room.

    When the Python server receives a request from a client to join a room, we
    create a new PlayerGameSession database object, assign it the unique_cookie_id
    that the client has set in their browser, set it to "PENDING", and return
    the IP of the game server and the primary key of the room that we have
    assigned the client.

    When the Rust game server receives a request to join the room, it sends an
    HTTP request to the Python server to verify that this cookie ID is allowed
    to join this room with this specific name. If the Python says that it is
    allowed, it updates the state to "IN_GAME" and returns OK to the Rust process,
    who then adds the player to the game and starts sending the client frames.

    When the Rust game server detects that the client has disconnected, it sends
    another HTTP request to the Python server to tell it to delete the Player
    object in the database.
    """
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=20, null=False, blank=False)

    session_cookie = models.CharField(max_length=300, null=False, blank=False)

    PENDING = "PENDING"
    IN_GAME = "IN_GAME"
    state = models.CharField(max_length=100, null=False, blank=False, choices=[(PENDING, PENDING), (IN_GAME, IN_GAME)])

    joined_time = models.DateTimeField(editable=False)

    def save(self, *args, **kwargs):
        """ When the object is first created, set the joined_time """
        if not self.id:
            self.joined_time = timezone.now()

        return super(PlayerGameSession, self).save(*args, **kwargs)












#
