package com.ecommerce.inventory.service;

import com.ecommerce.inventory.dto.InventoryDTO;
import com.ecommerce.inventory.model.Inventory;
import com.ecommerce.inventory.repo.InventoryRepo;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.List;

@Service
@Transactional
public class InventoryService {
    @Autowired
    private InventoryRepo inventoryRepo;

    @Autowired
    private ModelMapper modelMapper;

    public List<InventoryDTO> getAllItems() {
        List<Inventory>itemList = inventoryRepo.findAll();
        return modelMapper.map(itemList, new TypeToken<List<InventoryDTO>>(){}.getType());
    }

    public InventoryDTO saveItem(InventoryDTO inventoryDTO) {
        inventoryRepo.save(modelMapper.map(inventoryDTO, Inventory.class));
        return inventoryDTO;
    }

    public InventoryDTO updateItem(InventoryDTO inventoryDTO) {
        inventoryRepo.save(modelMapper.map(inventoryDTO, Inventory.class));
        return inventoryDTO;
    }

    public String deleteItem(Integer inventoryId) {
        inventoryRepo.deleteById(inventoryId);
        return "Item deleted";
    }

    public InventoryDTO getInventoryById(Integer inventoryId) {
        Inventory item = inventoryRepo.getInventoryById(inventoryId);
        return modelMapper.map(item, InventoryDTO.class);
    }

  public String reduceQuantity(Integer productId, Integer quantity){
      System.out.println(quantity);
      System.out.println(productId);
        Inventory inventory=inventoryRepo.findByProductId(productId);
      if (inventory == null) {
          throw new RuntimeException("Product not found in inventory");
      }

      if (inventory.getQuantity()>= quantity){
            inventory.setQuantity(inventory.getQuantity()-quantity);
            inventoryRepo.save(inventory);

          return "Inventory updated successfully";
      } else {
          throw new RuntimeException("Not enough stock available for product ID: " + productId);
      }
  }
}
