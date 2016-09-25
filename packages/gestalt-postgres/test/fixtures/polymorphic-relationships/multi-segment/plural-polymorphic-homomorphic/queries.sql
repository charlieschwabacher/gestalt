SELECT packages.* FROM packages
  JOIN vehicle_carried_packages ON
    vehicle_carried_packages.carried_package_id = packages.id
  JOIN user_drove_vehicles ON
    user_drove_vehicles.drove_vehicle_id = vehicle_carried_packages.vehicle_id AND
    user_drove_vehicles.drove_vehicle_type = vehicle_carried_packages.vehicle_type
  WHERE user_drove_vehicles.user_id = $1;

SELECT cars.* FROM cars
  JOIN user_drove_vehicles ON
    user_drove_vehicles.drove_vehicle_id = cars.id AND
    user_drove_vehicles.drove_vehicle_type = 'Car'
  WHERE user_drove_vehicles.user_id = $1;

SELECT cars.*, trucks.* FROM vehicle_carried_packages
  LEFT JOIN cars ON
    cars.id = vehicle_carried_packages.vehicle_id AND
    vehicle_carried_packages.vehicle_type = 'Car'
  LEFT JOIN trucks ON
    trucks.id = vehicle_carried_packages.vehicle_id AND
    vehicle_carried_packages.vehicle_type = 'Truck'
  WHERE vehicle_carried_packages.package_id = $1;
