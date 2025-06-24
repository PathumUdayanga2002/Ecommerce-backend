package com.ecommerce.order.repo;

import com.ecommerce.order.model.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepo extends JpaRepository<Order, Integer> {

    @EntityGraph(attributePaths = "items")
    List<Order> findAllByOrderByOrderDateDesc();
}
