package com.ecommerce.order.controller;


import com.ecommerce.order.dto.OrderDTO;
import com.ecommerce.order.dto.PlaceOrderResponseDTO;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.service.OrderService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class Controller {

    @Autowired
    private OrderService orderService;

    @GetMapping("/order/history")
    public ResponseEntity<List<Order>> orderHistory() {
        List<Order> orderlist =orderService.getOrderHistory();
        return ResponseEntity.ok(orderlist);
    }

    @DeleteMapping("/orders/clear")
    public ResponseEntity<String> clearOrders(){
        orderService.clearHistory();
        return ResponseEntity.ok("order History Cleared");
    }
    @PostMapping("/placeorder")
    public ResponseEntity<PlaceOrderResponseDTO> placeOrder(){
        return ResponseEntity.ok(orderService.placeOrder());
    }
}
