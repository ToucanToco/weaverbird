import logging
import time
from typing import List
import docker
import pymysql
from docker.models.images import Image

image = {
    'name': 'mysql_weaverbird_test',
    'image': 'mysql',
    'version': '5.7.21'
}
image_name = 'mysql:5.7.21'
docker_client = docker.from_env()
docker_container = None


def pytest_configure(config):
    """
    Allows plugins and conftest files to perform initial configuration.
    This hook is called for every plugin and initial conftest
    file after command line options have been parsed.
    """
    print('')
    print('pytest_configure')


def check_mysql_connection():
    ready = False
    while not ready:
        time.sleep(1)
        con_params = {
            'host': '127.0.0.1',
            'user': 'ubuntu',
            'password': 'ilovetoucan',
            'port': 3306,
            'database': 'mysql_db',
            'connect_timeout': 1000,
            'read_timeout': 28800,
            'write_timeout': 28800,
            'ssl_disabled': True
        }
        try:
            pymysql.connect(**con_params)
            ready = True
            return True
        except:
            pass


def pytest_sessionstart(session):
    """
    Called after the Session object has been created and
    before performing collection and entering the run test loop.
    """
    print('pytest_sessionstart')
    images: List[Image] = docker_client.images.list()
    found = False
    for i in images:
        if i.tags[0] == f'{image["image"]}:{image["version"]}':
            found = True
    if not found:
        logging.getLogger(__name__).info(f'Download docker image {image["image"]}:{image["version"]}')
        docker_client.images.pull('mysql:5.7.21')

    logging.getLogger(__name__).info(f'Start docker image {image["image"]}:{image["version"]}')
    global docker_container
    docker_container = docker_client.containers.run(
        image=f'{image["image"]}:{image["version"]}',
        name=f'{image["name"]}',
        auto_remove=True,
        detach=True,
        environment={
            'MYSQL_DATABASE': 'mysql_db',
            'MYSQL_ROOT_PASSWORD': 'ilovetoucan',
            'MYSQL_USER': 'ubuntu',
            'MYSQL_PASSWORD': 'ilovetoucan',
            'MYSQL_ROOT_HOST': '%'
        },
        ports={'3306': '3306'},
    )
    ready = False
    while not ready:
        if docker_container.status == 'created' and check_mysql_connection():
            ready = True
        time.sleep(1)


def pytest_sessionfinish(session, exitstatus):
    """
    Called after whole test run finished, right before
    returning the exit status to the system.
    """
    print('pytest_sessionfinish')


def pytest_unconfigure(config):
    """
    called before test process is exited.
    """
    print('pytest_unconfigure')
    global docker_container
    logging.getLogger(__name__).info(f'Stop docker image {docker_container.name}')
    docker_container.stop()
