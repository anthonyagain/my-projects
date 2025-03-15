from fabric import Connection

from getpass import getpass

SERVER = "anthony@69.164.217.18"

"""
This file contains utilities for scripts that connect to the server and do
things. I'm just tossing in here whatever needs to be shared between the various
Python scripts I want to make here.
"""

def get_ssh_password_func():
    ssh_pass = None
    def get_ssh_password():
        nonlocal ssh_pass
        if not ssh_pass:
            ssh_pass = getpass("{}'s password: ".format(SERVER))

        return ssh_pass

    return get_ssh_password

ssh_password = get_ssh_password_func()


def fabric_server_connection():
    return Connection(SERVER, connect_kwargs={"password": ssh_password()})


def call(command, conn, path, ignore_errors=False, use_sudo=False):
    """
    fabric resets the path every command, so this is a simple utility to append
    'cd [path] && ' onto every command.
    """
    full_command = "cd {} && {}".format(
        path,
        command
    )

    if ignore_errors:
        try:
            if not use_sudo:
                return conn.run(full_command)
            else:
                return conn.sudo(full_command)
        except Exception as e:
            print("Command failed: {}".format(command))
    else:
        if not use_sudo:
            return conn.run(full_command)
        else:
            return conn.sudo(full_command)
