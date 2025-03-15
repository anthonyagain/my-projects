from fabric import Connection
from invoke import Responder

from getpass import getpass
import os
import sys
import subprocess

SERVER = "anthony@167.172.148.211"

def ssh():
    os.system("ssh {}".format(SERVER))

def deploy():
    ssh_password = getpass("{}'s password: ".format(SERVER))
    PROJECT_NAME = "boundsoft"
    GITLAB_USERNAME = "anthonymacka"
    gitlab_password = getpass("GitLab password: ")
    project_url = "https://{}:{}@gitlab.com/anthonymacka/{}.git".format(
        GITLAB_USERNAME,
        gitlab_password,
        PROJECT_NAME
    )
    sudo_watcher = Responder(pattern=r'\[sudo\] password:', response=ssh_password)

    with Connection(SERVER, connect_kwargs={"password": ssh_password}) as c:
        path = os.path.join("/home", "anthony", "projects")
        call("rm -rf {}".format(PROJECT_NAME), c, path)
        call("git clone {}".format(project_url), c, path)

        path = os.path.join(path, "boundsoft", "boundsoft")
        call("ln -s settings_production.py settings.py", c, path)

        path = os.path.join(path, "..")
        call("virtualenv {}env".format(PROJECT_NAME), c, path)

        env = "source {}env/bin/activate".format(PROJECT_NAME)

        call("pip install -r requirements.txt", c, path, env)

        call("python manage.py collectstatic  --noinput", c, path, env)

        c.config.sudo.password = ssh_password
        c.sudo("sudo systemctl restart gunicorn")
        c.sudo("sudo systemctl restart nginx")

def call(command, conn, path, env="true"):
    """
    fabric resets the path every command, so this is a simple utility to append
    'cd [path] && ' onto every command.
    """
    return conn.run("cd {} && {} && {}".format(
        path,
        env,
        command
    ))

def main():
    if len(sys.argv) == 1:
        print("You must use either -ssh or -d when running this program.")
    else:
        if "-d" in sys.argv:
            deploy()
        if "-ssh" in sys.argv:
            ssh()

main()
