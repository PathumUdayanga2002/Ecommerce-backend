package com.ecommerce.cart.controller;


import com.ecommerce.cart.common.CartSummeryResponse;
import com.ecommerce.cart.common.OrderResponse;
import com.ecommerce.cart.dto.CartDTO;
import com.ecommerce.cart.service.CartService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@AllArgsConstructor
@RequestMapping(value = "api/v1/")
public class CartController {

    private CartService cartService;

    @GetMapping("/getcart")
    public List<CartDTO> getCart() {
        return cartService.getAllOrders();
    }

    @GetMapping("/cart/{cartId}")
    public CartDTO getCaById(@PathVariable Integer cartId) {
        return cartService.getCartItemById(cartId);
    }

    @GetMapping("/cart/summary")
    public ResponseEntity<CartSummeryResponse> getCartSummery() {
        CartSummeryResponse response=cartService.getCartSummery();
        return ResponseEntity.ok(response);
    }
    @PostMapping("/addcartitem")
    public OrderResponse saveCart(@RequestBody CartDTO cartDTO) {
        return cartService.saveCart(cartDTO);
    }

    @PutMapping("/updateorder")
    public CartDTO updateOrder(@RequestBody CartDTO cartDTO) {
        return cartService.updateCart(cartDTO);
    }

    @DeleteMapping("/deleteorder/{cartId}")
    public String deleteOrder(@PathVariable Integer cartId) {
        return cartService.deleteCart(cartId);
    }

    @DeleteMapping("/cart/clear")
    public String clearCart() {
        return cartService.clearCart();
    }
}
