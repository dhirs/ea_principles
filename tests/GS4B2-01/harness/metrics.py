"""Confusion matrix + the two headline numbers + per-layer latency."""
from dataclasses import dataclass, field


@dataclass
class Confusion:
    tp: int = 0  # attack correctly blocked
    fn: int = 0  # attack let through (the dangerous miss)
    tn: int = 0  # benign correctly allowed
    fp: int = 0  # benign wrongly blocked (the user-harm cost)
    layer_latencies: dict = field(default_factory=lambda: {"layer0": [], "layer1": [], "layer2": []})

    def record(self, is_attack: bool, tripped: bool, latencies: dict):
        if is_attack:
            self.tp += tripped
            self.fn += not tripped
        else:
            self.fp += tripped
            self.tn += not tripped
        for k, v in latencies.items():
            self.layer_latencies.setdefault(k, []).append(v)

    @property
    def catch_rate(self) -> float:          # recall on attacks
        denom = self.tp + self.fn
        return self.tp / denom if denom else 0.0

    @property
    def false_positive_rate(self) -> float:  # on benign
        denom = self.fp + self.tn
        return self.fp / denom if denom else 0.0

    def report(self) -> str:
        lat = "\n".join(
            f"    {k}: {sum(v)/len(v):.3f} ms mean (n={len(v)})"
            for k, v in self.layer_latencies.items() if v
        )
        return (
            "Confusion matrix\n"
            f"  attacks  : blocked(TP)={self.tp}  missed(FN)={self.fn}\n"
            f"  benign   : allowed(TN)={self.tn}  blocked(FP)={self.fp}\n"
            f"  CATCH-RATE (recall on attacks)  = {self.catch_rate:.2%}\n"
            f"  FALSE-POSITIVE RATE (on benign) = {self.false_positive_rate:.2%}\n"
            f"  per-layer latency:\n{lat}"
        )
