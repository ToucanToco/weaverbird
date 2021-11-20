import time


class StopWatch:
    def __enter__(self):
        self.begin = time.perf_counter()

    def __exit__(self, type, value, traceback):
        self.end = time.perf_counter()
        self.interval = self.end - self.begin
