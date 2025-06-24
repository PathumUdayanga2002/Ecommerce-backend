package com.ecommerce.cart.common;

import com.ecommerce.cart.dto.CartDTO;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Getter
@Setter
public class CartSummeryResponse {
    private List<CartDTO> items;
    private int totalCartPrice;

    public CartSummeryResponse(List<CartDTO> items, int totalCartPrice) {
        this.items = items;
        this.totalCartPrice = totalCartPrice;
    }

}
