# Elevator Saga Solution

I'm optimizing for avg/max wait time, which seems to be a more useful
parallel to real-world elevator programming. No attempt is made at this stage to
minimize moves, since to my mind that requires strategies completely at odds
with the above goals.

It's worth noting that, for most levels, the spawn rate isn't anywhere near
saturation point, and therefore throughput converges on this amount, making it a
less-than-useful metric.

# Level 19 Benchmarks

My favourite performance benchmark is to get onto Level 19, crank the spawn rate to 2.5,
and then let the sim run at 55x for a minute or so. Here's the numbers I've got
so far:

## V1 (Latest)

```
Time Run: ?
Avg:      21.4
Max:      87
```
