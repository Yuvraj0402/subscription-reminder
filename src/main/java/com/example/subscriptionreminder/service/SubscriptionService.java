
package com.example.subscriptionreminder.service;

import com.example.subscriptionreminder.entity.Subscription;
import com.example.subscriptionreminder.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository repository;

    public SubscriptionService(SubscriptionRepository repository) {
        this.repository = repository;
    }

    public List<Subscription> getAll() {
        return repository.findAll();
    }

    public List<Subscription> getActive() {
        return repository.findByActiveTrueOrderByRenewalDateAsc();
    }

    public List<Subscription> getUpcoming() {
        LocalDate today = LocalDate.now();
        return repository
                .findByActiveTrueAndRenewalDateBetweenOrderByRenewalDateAsc(
                        today, today.plusDays(7)
                );
    }

    public BigDecimal getMonthlyTotal() {
        return getActive().stream()
                .map(s -> {
                    BigDecimal cost = s.getCost();

                    return switch (s.getBillingCycle().toLowerCase()) {
                        case "weekly" ->
                                cost.multiply(BigDecimal.valueOf(52))
                                        .divide(BigDecimal.valueOf(12), 2,
                                                java.math.RoundingMode.HALF_UP);
                        case "monthly" -> cost;
                        case "quarterly" ->
                                cost.divide(BigDecimal.valueOf(3), 2,
                                        java.math.RoundingMode.HALF_UP);
                        case "yearly" ->
                                cost.divide(BigDecimal.valueOf(12), 2,
                                        java.math.RoundingMode.HALF_UP);
                        default -> BigDecimal.ZERO;
                    };
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Subscription getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Subscription not found"));
    }

    public Subscription save(Subscription subscription) {
        return repository.save(subscription);
    }

    public void delete(Long id) {
        repository.delete(getById(id));
    }

    @Transactional
    public void cancel(Long id) {
        Subscription subscription = getById(id);
        subscription.setActive(false);
        repository.save(subscription);
    }
}
