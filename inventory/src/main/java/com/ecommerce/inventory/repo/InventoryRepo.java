package com.ecommerce.inventory.repo;

import com.ecommerce.inventory.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepo extends JpaRepository<Inventory, Integer> {
    @Query(value = "SELECT * FROM inventory WHERE inventory_id = ?1", nativeQuery = true)
    Inventory getInventoryById(Integer inventoryId);
    @Query(value = "SELECT * FROM inventory WHERE product_id = ?1", nativeQuery = true)
    Inventory findByProductId(Integer inventoryId);
}
