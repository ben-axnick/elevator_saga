{
  init: function(elevators, floors) {
    const immediacy = 2;
    const passingPickupThreshold = 0.7;

    // Track pressed floors
    const floorButtons = _.map(floors, function(floor) {
      return {
        num: floor.floorNum(),
        dirs: []
      };
    });

    const getFloorButton = function(floorNum) {
      return _.find(floorButtons, function(entry) {
        return entry.num == floorNum;
      });
    };

    const addFloorDirection = function(floorNum, dir) {
      var floorButton = getFloorButton(floorNum);
      floorButton.dirs = _.union(floorButton.dirs, [dir]);
    };

    const clearFloorButton = function(floorNum, clearUp, clearDown) {
      var dirs = [];

      if (clearUp) { dirs.push("up"); }
      if (clearDown) { dirs.push("down"); }


      getFloorButton(floorNum).dirs = _.difference(
        getFloorButton(floorNum).dirs,
        dirs
      );
    };

    const immediateElevatorDestinations = function() {
      return _.chain(elevators)
        .map(function(elevator) {
          return _.take(elevator.destinationQueue, immediacy);
        })
        .flatten()
        .union()
        .value();
    }

    const unservicedButtons = function() {
      return _.filter(floorButtons, function(button) {
        return !floorIsServiced(button.num);
      });
    }

    const floorIsServiced = function(floorNum) {
      return _.contains(immediateElevatorDestinations(), floorNum);
    }

    const closestWaitingButton = function(floorNum) {
      return _.chain(unservicedButtons())
        .sortBy(function(button) {
          return Math.abs(button.num - floorNum);
        })
      .find(function(button) {
        return button.dirs.length > 0;
      })
      .value();
    };

    const personWaitingForDirection = function(floorNum, dir) {
      const floorButton = getFloorButton(floorNum);

      return _.contains(floorButton.dirs, dir);
    };

    const setLightBasedOnQueue = function(elevator) {
      elevator.checkDestinationQueue();

      if (elevator.destinationQueue.length === 0) {
        elevator.goingUpIndicator(true);
        elevator.goingDownIndicator(true);

        return;
      }

      const nextFloor = _.first(elevator.destinationQueue);
      const currentFloor = elevator.currentFloor();

      if (nextFloor > currentFloor) {
        indicateElevatorGoingUp(elevator);
      } else if (nextFloor < currentFloor) {
        indicateElevatorGoingDown(elevator);
      }

    }

    const orderByDistance = function(arr, floorNum) {
      return _.sortBy(arr, function(item) {
        return Math.abs(item - floorNum);
      });
    }

    const reoptimizeDestinations = function(elevator) {
      elevator.destinationQueue = orderByDistance(
        elevator.destinationQueue,
        elevator.currentFloor()
      );

      elevator.checkDestinationQueue();
    }

    const indicateElevatorGoingUp = function(elevator) {
      elevator.goingUpIndicator(true);
      elevator.goingDownIndicator(false);
    };

    const indicateElevatorGoingDown = function(elevator) {
      elevator.goingUpIndicator(false);
      elevator.goingDownIndicator(true);
    };

    _.each(floors, function(floor) {
      floor.on("up_button_pressed", function() {
        addFloorDirection(floor.floorNum(), "up");
      });

      floor.on("down_button_pressed", function() {
        addFloorDirection(floor.floorNum(), "down");
      });
    });

    _.each(elevators, function(elevator) {
      elevator.on("idle", function() {
        const closestWaiting = closestWaitingButton(elevator.currentFloor());

        if (closestWaiting) {
          elevator.goToFloor(closestWaiting.num);
          setLightBasedOnQueue(elevator);
        } else {
          setTimeout(function() {
            // forces idle event to re-trigger if still idle
            elevator.checkDestinationQueue();
          }, 1000)
        }
      });

      elevator.on("floor_button_pressed", function(floorNum) {
        elevator.goToFloor(floorNum);
        reoptimizeDestinations(elevator);
        setLightBasedOnQueue(elevator);
      });

      elevator.on("passing_floor", function(floorNum, direction) {
        if (personWaitingForDirection(floorNum, direction)) {
          if (elevator.loadFactor() <= passingPickupThreshold) {
            elevator.goToFloor(floorNum, true);
          }
        }
      });

      elevator.on("stopped_at_floor", function(floorNum) {
        setLightBasedOnQueue(elevator);

        clearFloorButton(
          floorNum,
          elevator.goingUpIndicator(),
          elevator.goingDownIndicator()
        );
      });
    });
  },
  update: function(dt, elevators, floors) {
    // We normally don't need to do anything here
  }
}
