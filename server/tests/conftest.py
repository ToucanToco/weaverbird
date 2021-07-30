import socket
import time
from contextlib import suppress
from os import environ, path

import pytest
import yaml
from docker import APIClient
from docker.tls import TLSConfig
from slugify import slugify


def pytest_addoption(parser):
    parser.addoption('--pull', action='store_true', default=False, help='Pull docker images')


@pytest.fixture(scope='session')
def docker_pull(request):
    return request.config.getoption('--pull')


@pytest.fixture(scope='session')
def docker():
    docker_kwargs = {'version': 'auto'}
    if 'DOCKER_HOST' in environ:
        docker_kwargs['base_url'] = environ['DOCKER_HOST']
    if environ.get('DOCKER_TLS_VERIFY', 0) == '1':
        docker_kwargs['tls'] = TLSConfig(
            (f"{environ['DOCKER_CERT_PATH']}/cert.pem", f"{environ['DOCKER_CERT_PATH']}/key.pem")
        )
    return APIClient(**docker_kwargs)


@pytest.fixture(scope='session')
def unused_port():
    def f():
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('127.0.0.1', 0))
            return s.getsockname()[1]

    return f


def wait_for_container(checker_callable, host_port, image, skip_exception=None, timeout=60):
    skip_exception = skip_exception or Exception
    for i in range(timeout):
        try:
            checker_callable(host_port)
            break
        except skip_exception as e:
            print(f'Waiting for image to start...(last exception: {e})')
            time.sleep(1)
    else:
        pytest.fail(f'Cannot start {image} server')


@pytest.fixture(scope='module')
def container_starter(request, docker, docker_pull):
    def f(
        image,
        internal_port,
        host_port,
        env=None,
        volumes=None,
        command=None,
        checker_callable=None,
        skip_exception=None,
        timeout=None,
    ):

        if docker_pull:
            print(f'Pulling {image} image')
            docker.pull(image)

        host_config = docker.create_host_config(
            port_bindings={internal_port: host_port}, binds=volumes
        )

        if volumes is not None:
            volumes = [vol.split(':')[1] for vol in volumes]

        container_name = '-'.join(['toucan', slugify(image), 'server'])
        print(f'Creating {container_name} on port {host_port}')
        container = docker.create_container(
            image=image,
            name=container_name,
            ports=[internal_port],
            detach=True,
            environment=env,
            volumes=volumes,
            command=command,
            host_config=host_config,
        )

        print(f'Starting {container_name}')
        docker.start(container=container['Id'])

        def fin():
            print(f'Stopping {container_name}')
            docker.kill(container=container['Id'])
            print(f'Killing {container_name}')
            with suppress(Exception):
                docker.remove_container(container['Id'], v=True)

        request.addfinalizer(fin)
        container['port'] = host_port

        if checker_callable is not None:
            wait_for_container(checker_callable, host_port, image, skip_exception, timeout)
        return container

    return f


@pytest.fixture(scope='module')
def service_container(unused_port, container_starter):
    def f(service_name, checker_callable=None, skip_exception=None, timeout=60):
        with open(f'{path.dirname(__file__)}/docker-compose.yml') as docker_comppse_yml:
            docker_conf = yaml.load(docker_comppse_yml)
        service_conf = docker_conf[service_name]
        volumes = service_conf.get('volumes')
        if volumes is not None:
            volumes = [path.join(path.dirname(__file__), vol) for vol in volumes]
        params = {
            'image': service_conf['image'],
            'internal_port': service_conf['ports'][0].split(':')[0],
            'host_port': unused_port(),
            'env': service_conf.get('environment'),
            'volumes': volumes,
            'command': service_conf.get('command'),
            'timeout': timeout,
            'checker_callable': checker_callable,
            'skip_exception': skip_exception,
        }

        return container_starter(**params)

    return f
