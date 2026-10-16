"""Explicit wire seam; no live execution entry point or credential discovery.

Callers supply a token and session factory. Future live wiring must first gain
an exact allowance and hard process containment. Importing this module does not
construct a client. The executor currently permits fixture transports only.
"""
import sample_live
import timeseries_executor

BASE = sample_live.BASE


class Adapter(sample_live.Adapter):
    """Reuse reviewed bounded metadata and separated unauthenticated asset I/O."""
    def submit(self, dataset, request, timeout):
        expected = timeseries_executor.plan()
        candidate = dict(expected, dataset=dataset, request=request)
        timeseries_executor.validate_plan(candidate)
        return super().submit(dataset, request, timeout)
