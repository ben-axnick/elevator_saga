# Elevator Saga Solution

I'm optimizing for avg/max wait time, which seems to be a more useful
parallel to real-world elevator programming. No attempt is made at this stage to
minimize moves, since to my mind that requires strategies completely at odds
with the above goals.

It's worth noting that, for most levels, the spawn rate isn't anywhere near
saturation point, and therefore throughput converges on this amount, making it a
less-than-useful metric.

# Changelog

## V1

Fairly ad-hoc solution with an attempt at light-tracking. Generally strives to
keep elevators moving as efficiently as possible by:

- Picking up the closest waiting passengers
- Using the lights
- Re-ordering destinations to go to the closest first
- Avoid floors that already have an elevator en-route

## V2

- Fix handling of lights, the whole `if(truthy)` breaks down for integer zero
- Floors no longer directly summon elevators, this is only handled in their idle
    event - it makes it easier to keep it straight what happens even if it
    introduces a poll vs the previous pure evented strategy.
- Only consider the next N destinations instead of all of them when considering
    if a floor is "serviced", large elevators can introduce a big wait time
    without this.

## V2.1

- Cleaned up the code, was using conventions of multiple languages combined with poor indentation, no functional changes.

# Level 19 Benchmarks

My favourite performance benchmark is to get onto Level 19, crank the spawn rate to 2.5,
and then let the sim run at 55x for a minute or so. Here's the numbers I've got
so far:

## V1

```
Time Run: ?
Avg:      21.4
Max:      87
Spawn:    2.5
```

## V2 (Latest)

```
Time Run: ?
Avg:      19.4
Max:      74
Spawn:    2.5
```
