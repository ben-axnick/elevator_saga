{
  init: function(elevators, floors) {
    const passingPickupThreshold = 0.7;

    // Track pressed floors
    floor_buttons = _.map(floors, function(floor) {
      return {
        num: floor.floorNum(),
                  dirs: []
      };
    });

    getFloorButton = function(floorNum) {
      return _.find(floor_buttons, function(entry) {
        return entry.num == floorNum;
      });
    };

    addFloorDirection = function(floorNum, dir) {
      floorButton = getFloorButton(floorNum);
      floorButton.dirs = _.union(floorButton.dirs, [dir]);
    };

    clearFloorButton = function(floorNum, clearUp, clearDown) {
      dirs = [];
      if (clearUp) { dirs.push("up"); }
      if (clearDown) { dirs.push("down"); }


      getFloorButton(floorNum).dirs = _.difference(
          getFloorButton(floorNum).dirs,
          dirs
          )
    };

    elevatorDestinations = function() {
      return _.chain(elevators)
        .map(function(elevator) {
          return elevator.destinationQueue;
        })
      .flatten()
        .union()
        .value();
    }

    unservicedButtons = function() {
      buttons = _.filter(floor_buttons, function(button) {
        return !floorIsServiced(button.num);
      });

      return buttons;
    }

    floorIsServiced = function(floorNum) {
      return _.contains(elevatorDestinations(), floorNum);
    }

    closestWaitingButton = function(floorNum) {
      return _.chain(unservicedButtons())
        .sortBy(function(button) {
          return Math.abs(button.num - floorNum);
        })
      .find(function(button) {
        return button.dirs.length > 0;
      })
      .value();
    };

    isActuallyIdle = function(elevator) {
      return elevator.destinationDirection() == "stopped" &&
        elevator.loadFactor() == 0;
    }

    selectIdleElevators = function() {
      return _.filter(elevators, function(elevator) {
        return isActuallyIdle(elevator);
      });
    };

    sendElevatorIfIdle = function(floorNum) {
      idleElevator = selectIdleElevators()[0];

      if (idleElevator) {
        idleElevator.goToFloor(floorNum);
        console.log("Sending elevator to #" + floorNum + " because it was idle (sendIfIdle)");
      }

    }

    personWaitingForDirection = function(floorNum, dir) {
      floorButton = getFloorButton(floorNum);

      return _.contains(floorButton.dirs, dir);
    };

    setLightBasedOnQueue = function(elevator) {
      nextFloor = elevator.destinationQueue[0];
      if (!nextFloor) {
        elevator.goingUpIndicator(true);
        elevator.goingDownIndicator(true);
        return;
      }

      currentFloor = elevator.currentFloor();

      if (nextFloor > currentFloor) {
        elevatorIsGoingUp(elevator);
      } else if (nextFloor < currentFloor) {
        elevatorIsGoingDown(elevator);
      }

    }

    orderByDistance = function(arr, floorNum) {
      return _.sortBy(arr, function(item) {
        return Math.abs(item - floorNum);
      });
    }

    reoptimizeDestinations = function(elevator) {
      elevator.destinationQueue = orderByDistance(
          elevator.destinationQueue,
          elevator.currentFloor()
          );

      elevator.checkDestinationQueue();
    }

    _.each(floors, function(floor) {
      floor.on("up_button_pressed", function() {
        addFloorDirection(floor.floorNum(), "up");

        if (floorIsServiced(floor.floorNum())) {
          console.log("Ignored button " + floor.floorNum());
          return;
        }

        sendElevatorIfIdle(floor.floorNum());
      });

      floor.on("down_button_pressed", function() {
        addFloorDirection(floor.floorNum(), "down");

        if (floorIsServiced(floor.floorNum())) {
          console.log("Ignored button " + floor.floorNum());
          return;
        }

        sendElevatorIfIdle(floor.floorNum());
      });
    });

    elevatorIsGoingUp = function(elevator) {
      elevator.goingUpIndicator(true);
      elevator.goingDownIndicator(false);
    };

    elevatorIsGoingDown = function(elevator) {
      elevator.goingUpIndicator(false);
      elevator.goingDownIndicator(true);
    };

    // now set elevators in motion

    _.each(elevators, function(elevator) {
      // Whenever the elevator is idle (has no more queued destinations) ...
      elevator.on("idle", function() {
        if (isActuallyIdle(elevator)) {
          closestWaiting = closestWaitingButton(elevator.currentFloor());

          if (closestWaiting) {
            console.log("Sending elevator to #" + closestWaiting.num + " because it was idle");
            elevator.goToFloor(closestWaiting.num);
          }
        } else {
          console.log("Elevator reported idle but it wasn't really.")
        }
      });

      elevator.on("floor_button_pressed", function(floorNum) {
        setLightBasedOnQueue(elevator);
        elevator.goToFloor(floorNum);
        reoptimizeDestinations(elevator);
      });

      elevator.on("passing_floor", function(floorNum, direction) {
        setLightBasedOnQueue(elevator);

        if (personWaitingForDirection(floorNum, direction)) {
          if (elevator.loadFactor() <= passingPickupThreshold) {
            elevator.goToFloor(floorNum, true);
            console.log("Stopped for person, they're going the same way!");
          } else {
            console.log("Skipping person, elevator too full");
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
