from fabric import Connection
from invoke import Responder
import pexpect

from getpass import getpass
import os
import shutil
import sys
import subprocess
import time
import posixpath

from utils import SERVER, fabric_server_connection, call, ssh_password

"""
Installation: (Python 3)
    pip install fabric==2.5.0
    pip install pexpect==4.8.0


Note that I spent two days straight trying to do the stat pulling task just
using the standard library and not using pexpect - I am convinced it is
impossible. Just use pexpect.
"""

GRAPHS_DIR = "/Users/anthony/projects/flagdigger/devops/flame_graphs"

def ssh():
    os.system("ssh {}".format(SERVER))


def deploy():
    """
    To make sudo work, you must uncomment both of the commented sudo lines (we
    just aren't currently using sudo for anything here).
    """
    PROJECT_NAME = "flagdigger"
    is_anthony = input("Are you Anthony? (y/N): ")
    if is_anthony.lower() == "y":
        GITLAB_USERNAME = "anthonymacka"
    else:
        GITLAB_USERNAME = input("Gitlab Username: ")
    gitlab_password = getpass("GitLab password: ")
    project_url = "https://{}:{}@gitlab.com/anthonymacka/{}.git".format(
        GITLAB_USERNAME,
        gitlab_password,
        PROJECT_NAME
    )

    # this line is not actually redundant, fabric uses it behind the scenes
    sudo_watcher = Responder(pattern=r'\[sudo\] password:', response=ssh_password())

    with fabric_server_connection() as c:



        dir_path = posixpath.join("/home", "anthony", "projects")
        project_path = posixpath.join(dir_path, PROJECT_NAME + "-new")
        django_path = posixpath.join(project_path, "django_webserver")
        django_inner_path = posixpath.join(django_path, "django_webserver")
        react_path = posixpath.join(django_path, "frontend_react")
        rust_path = posixpath.join(project_path, "rust_gameserver")
        env_command = "source {}env/bin/activate && ".format(PROJECT_NAME)
        c.config.sudo.password = ssh_password()

        # delete invalid files if the last build crashed midway through
        call("rm -rf {}".format(PROJECT_NAME + "-new"), c, dir_path, use_sudo=True, ignore_errors=False)

        # clone project
        call("git clone {} {}".format(project_url, PROJECT_NAME + "-new"), c, dir_path)
        # call("git checkout dev", c, project_path)

        # set up rust - trigger an error and halt this script if build fails
        call("rustup default nightly", c, rust_path)
        call("rustup update nightly", c, rust_path)
        call("cargo build --release", c, rust_path)

        # set up react
        call("npm install && npm run build", c, react_path)

        # set up django
        call("ln -s settings_production.py settings.py", c, django_inner_path)
        call("virtualenv {}env".format(PROJECT_NAME), c, django_path)
        call(env_command + "pip install -r requirements.txt", c, django_path)
        call(env_command + "python manage.py migrate", c, django_path)
        call(env_command + "python manage.py collectstatic --noinput", c, django_path)

        # delete the old project
        call("rm -rf {}".format(PROJECT_NAME + "-old"), c, dir_path, ignore_errors=True)
        call("mv {} {}".format(PROJECT_NAME, PROJECT_NAME + "-old"), c, dir_path, ignore_errors=True)
        call("mv {} {}".format(PROJECT_NAME + "-new", PROJECT_NAME), c, dir_path)

        # restart everything
        #c.sudo("sudo systemctl restart flagdigger-rust")
        #c.sudo("sudo systemctl restart flagdigger-django")
        #c.sudo("sudo systemctl restart nginx")


        call("rm -rf {}".format(PROJECT_NAME + "-old"), c, path, ignore_errors=True)


def calc_local_file_name():
    """ Find an available name to save the log file with locally. """

    local_file_name_template = "/Users/anthony/projects/flagdigger/devops/flagdigger-out{}.log"
    num = 0
    local_file_name = local_file_name_template.format("")
    while os.path.exists(local_file_name):
        num += 1
        local_file_name = local_file_name_template.format(num)

    return local_file_name


def fetch_recent_stats():
    """
    1. ssh into server
    2. clear the pm2 logs, restart the process
    3. sleep for 60 seconds
    4. copy the pm2 logs locally
    5. restart the process to start a new flame graph
    6. copy the flame graph locally
    """
    with Connection(SERVER, connect_kwargs={"password": ssh_password()}) as c:
        path = os.path.join("/home", "anthony", "projects")
        call("pm2 restart flagdigger", c, path)
        call("pm2 flush", c, path)
        time.sleep(60)
        scp_command = 'scp {}:/home/anthony/.pm2/logs/flagdigger-out.log {}'.format(SERVER, calc_local_file_name())
        run_scp_command(scp_command)
        call("pm2 restart flagdigger", c, path)
        fetch_latest_flame_graph()


def run_scp_command(scp_command):
    """
    Run the given SCP command using pexpect.
    """
    child = pexpect.spawn(scp_command, timeout=90)
    #child.logfile = sys.stdout.buffer

    i = child.expect([pexpect.TIMEOUT, "password:"])
    if i == 0:
        raise Exception("Unexpected output: {} {}".format(child.before, child.after))
    else:
        ssh_pass_bytes = (ssh_password() + "\n").encode()
        child.sendline(ssh_pass_bytes)
    child.read()

def fetch_latest_flame_graph():
    """
    Search the project folder on the server for the latest flame graph, and
    fetch just that one.
    """
    with Connection(SERVER, connect_kwargs={"password": ssh_password()}) as c:
        path = os.path.join("/home", "anthony", "projects", "flagdigger")
        dir_contents = str(call("ls", c, path)).split("\n")
        flame_graph_files = [file_name for file_name in dir_contents if ".0x" in file_name]
        latest_flame_graph = sorted(flame_graph_files)[-1]
        call("0x --visualize-only {}".format(latest_flame_graph), c, path)

    if not os.path.exists(GRAPHS_DIR):
        os.mkdir(GRAPHS_DIR)

    latest_graph_path = os.path.join(GRAPHS_DIR, latest_flame_graph)
    if os.path.exists(latest_graph_path):
        shutil.rmtree(latest_graph_path)

    scp_command = 'scp -r {}:/home/anthony/projects/flagdigger/{} {}'.format(SERVER, latest_flame_graph, GRAPHS_DIR)
    run_scp_command(scp_command)

def fetch_all_flame_graphs():
    """
    1. delete all graphs we have stored locally
    2. copy all graphs stored in prod, locally

    (afterwards, run this command:
      0x --visualize-only [0x id]
     note that this requires you to have 0x installed (npm install -g 0x))
    """
    if os.path.exists(GRAPHS_DIR):
        shutil.rmtree(GRAPHS_DIR)
    os.mkdir(GRAPHS_DIR)

    scp_command = 'scp -r {}:/home/anthony/projects/flagdigger/*.0x {}'.format(SERVER, GRAPHS_DIR)
    run_scp_command(scp_command)


def main():
    if len(sys.argv) == 1:
        print("You must specify one of these flags when running this program: -d, -ssh, or -logs")
    else:
        if "-d" in sys.argv:
            deploy()
        if "-ssh" in sys.argv:
            ssh()
        if "-stats60" in sys.argv:
            fetch_recent_stats()
        if "-flame" in sys.argv:
            fetch_latest_flame_graph()

main()
