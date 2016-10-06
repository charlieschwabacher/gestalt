SELECT packages.* FROM packages
  JOIN vehicle_carried_packages ON
    vehicle_carried_packages.carried_package_id = packages.id
  JOIN user_drove_vehicles ON
    user_drove_vehicles.drove_vehicle_id = vehicle_carried_packages.vehicle_id AND
    user_drove_vehicles.drove_vehicle_type = vehicle_carried_packages.vehicle_type
  WHERE user_drove_vehicles.user_id = ANY ($1);
