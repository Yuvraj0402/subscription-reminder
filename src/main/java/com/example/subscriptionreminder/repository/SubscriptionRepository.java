
package com.example.subscriptionreminder.repository;

import com.example.subscriptionreminder.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long> {

    List<Subscription> findByActiveTrueOrderByRenewalDateAsc();

    List<Subscription>
    findByActiveTrueAndRenewalDateBetweenOrderByRenewalDateAsc(
            LocalDate start, LocalDate end
    );
}
