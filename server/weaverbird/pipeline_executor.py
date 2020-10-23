from typing import Callable, List

import pandas as pd

from weaverbird.steps import DomainStep


class PipelineExecutor:
    """
    The main class of the module.

    Its domain retriever will be use to retrieve data needed from `domains` steps.
    """

    def __init__(self, domain_retriever: Callable[[str], pd.DataFrame]):
        self.retrieve_domain = domain_retriever

    def execute_pipeline(self, pipeline: List[dict]):
        # TODO validate the pipeline, e.g. the first step should always be a domain step
        # self.validate_pipeline()
        domain_step = DomainStep(**pipeline[0])
        df = self.retrieve_domain(domain_step.domain)
        # TODO validate and apply all other steps
        return df
