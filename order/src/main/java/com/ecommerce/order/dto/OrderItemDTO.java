package com.ecommerce.order.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDTO {
    private int productId;
    private String productName;
    private int quantity;
    private int totalPrice;
}

