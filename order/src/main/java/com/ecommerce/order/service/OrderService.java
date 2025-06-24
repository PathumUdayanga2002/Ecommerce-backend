//package com.ecommerce.order.service;
//
//
//import com.ecommerce.cart.dto.CartDTO;
//import com.ecommerce.cart.model.Cart;
//import com.ecommerce.order.dto.OrderDTO;
//import com.ecommerce.order.dto.PlaceOrderResponseDTO;
//import com.ecommerce.order.model.Order;
//import com.ecommerce.order.model.OrderItem;
//import com.ecommerce.order.repo.OrderItemRepo;
//import com.ecommerce.order.repo.OrderRepo;
//import org.modelmapper.ModelMapper;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.reactive.function.client.WebClient;
//
//import java.time.LocalDate;
//import java.util.ArrayList;
//import java.util.List;
//import java.util.SimpleTimeZone;
//
//@Service
//public class OrderService {
//
//    @Autowired
//    private WebClient.Builder webClientBuilder;
//
//    @Autowired
//    private OrderRepo orderRepo;
//
//    @Autowired
//    private OrderItemRepo orderItemRepo;
//
//    @Autowired
//    private ModelMapper modelMapper;
//
//    public PlaceOrderResponseDTO placeOrder(){
//        // get all cart items
//
//        List<CartDTO> cartItems = webClientBuilder.build()
//                .get()
//                .uri("http://localhost:8083/api/v1/getcart")
//                .retrieve()
//                .bodyToFlux(CartDTO.class)
//                .collectList()
//                .block();
//        if (cartItems==null || cartItems.isEmpty()){
//            throw new RuntimeException("Cart is empty cannot place the order");
//        }
//
//        // calculate the totla and map to the order items
//
//        List<OrderItem> orderItems= new ArrayList<>();
//        int totalPrice=0;
//        for (CartDTO item :cartItems){
//            totalPrice+= item.getTotalPrice();
//
//            OrderItem orderItem = new OrderItem();
//            orderItem.setProductId(item.getProductId());
//            orderItem.setProductName(item.getProductName());
//            orderItem.setQuantity(item.getQuantity());
//            orderItem.setTotalPrice(item.getTotalPrice());
//
//            orderItems.add(orderItem);
//
//            webClientBuilder.build()
//                    .put()
//                    .uri("http://localhost:8081/api/v1/updatequantity/"+item.getProductId())
//                    .bodyValue(item.getQuantity())
//                    .retrieve()
//                    .bodyToMono(String.class)
//                    .block();
//        }
//
//        //order save
//
//        Order order = new Order();
//        order.setTotalPrice(totalPrice);
//        order.setOrderDate(LocalDate.now());
//
//        // Set up bidirectional relationship
//        for (OrderItem item : orderItems) {
//            item.setOrder(order);
//        }
//        order.setItems(orderItems);
//
//        Order saveOrder = orderRepo.save(order);
//
//        webClientBuilder
//                .build()
//                .delete()
//                .uri("http://localhost:8083/api/v1/cart/clear")
//                .retrieve()
//                .bodyToMono(String.class)
//                .block();
//        //prepare response
//
//        OrderDTO orderDTO = modelMapper.map(saveOrder, OrderDTO.class);
//
//        PlaceOrderResponseDTO response =new PlaceOrderResponseDTO();
//
//        response.setMessage("Order Placed Successfully");
//        response.setOrder(orderDTO);
//
//        return response;
//    }
//
//    public List<Order> getOrderHistory() {
//        return orderRepo.findAllByOrderByOrderDateDesc();
//    }
//
//
//    public void clearHistory() {
//        // Get all orders
//        List<Order> orders = orderRepo.findAll();
//
//        // Delete all order items
//        orderItemRepo.deleteAll();
//
//        // Then delete all orders
//        orderRepo.deleteAll();
//    }
//}
package com.ecommerce.order.service;

import com.ecommerce.cart.dto.CartDTO;
import com.ecommerce.order.dto.OrderDTO;
import com.ecommerce.order.dto.PlaceOrderResponseDTO;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.repo.OrderItemRepo;
import com.ecommerce.order.repo.OrderRepo;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    private OrderRepo orderRepo;

    @Autowired
    private OrderItemRepo orderItemRepo;

    @Autowired
    private ModelMapper modelMapper;

    public PlaceOrderResponseDTO placeOrder() {
        // Get all cart items
        List<CartDTO> cartItems = webClientBuilder.build()
                .get()
                .uri("http://localhost:8083/api/v1/getcart")
                .retrieve()
                .bodyToFlux(CartDTO.class)
                .collectList()
                .block();

        if (cartItems == null || cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty, cannot place the order");
        }

        List<OrderItem> orderItems = new ArrayList<>();
        int totalPrice = 0;

        for (CartDTO item : cartItems) {
            totalPrice += item.getTotalPrice();

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(item.getProductId());
            orderItem.setProductName(item.getProductName());
            orderItem.setQuantity(item.getQuantity());
            orderItem.setTotalPrice(item.getTotalPrice());

            orderItems.add(orderItem);
try {


    // Reduce quantity in inventory
    webClientBuilder.build()
            .put()
            .uri("http://localhost:8081/api/v1/updatequantity/" + item.getProductId())
            .bodyValue(item.getQuantity())
            .retrieve()
            .onStatus(
                    status -> status.is4xxClientError() || status.is5xxServerError(),
                    clientResponse -> clientResponse.bodyToMono(String.class)
                            .map(errorMessage -> new RuntimeException("Inventory Service Error: " + errorMessage))
            )
            .bodyToMono(String.class)
            .block();
}catch (RuntimeException e){
    throw new RuntimeException("Failed to update inventory for product ID " + item.getProductId() + ": " + e.getMessage());
}
        }

        // Create and save order
        Order order = new Order();
        order.setTotalPrice(totalPrice);
        order.setOrderDate(LocalDate.now());

        // Set bidirectional relationship
        for (OrderItem item : orderItems) {
            item.setOrder(order); // important line
        }
        order.setItems(orderItems);

        Order savedOrder = orderRepo.save(order);

        // Clear the cart
        webClientBuilder.build()
                .delete()
                .uri("http://localhost:8083/api/v1/cart/clear")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Prepare response
        OrderDTO orderDTO = modelMapper.map(savedOrder, OrderDTO.class);

        PlaceOrderResponseDTO response = new PlaceOrderResponseDTO();
        response.setMessage("Order Placed Successfully");
        response.setOrder(orderDTO);

        return response;
    }

    public List<Order> getOrderHistory() {
        return orderRepo.findAllByOrderByOrderDateDesc();
    }

    @Transactional
    public void clearHistory() {
        // Delete all orders (OrderItem will be deleted due to cascade and orphanRemoval)
        orderRepo.deleteAll();
    }
}
