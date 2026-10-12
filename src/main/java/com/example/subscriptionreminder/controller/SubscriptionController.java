
package com.example.subscriptionreminder.controller;

import com.example.subscriptionreminder.entity.Subscription;
import com.example.subscriptionreminder.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/subscriptions")
public class SubscriptionController {

    private final SubscriptionService service;

    public SubscriptionController(SubscriptionService service) {
        this.service = service;
    }

    @GetMapping
    public String list(Model model) {
        model.addAttribute("subscriptions", service.getActive());
        model.addAttribute("upcoming", service.getUpcoming());
        model.addAttribute("monthlyTotal", service.getMonthlyTotal());
        return "subscriptions";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("subscription", new Subscription());
        return "subscription-form";
    }

    @PostMapping("/save")
    public String save(
            @Valid @ModelAttribute("subscription")
            Subscription subscription,
            BindingResult result) {

        if (result.hasErrors()) {
            return "subscription-form";
        }

        service.save(subscription);
        return "redirect:/subscriptions";
    }

    @GetMapping("/edit/{id}")
    public String edit(@PathVariable Long id, Model model) {
        model.addAttribute("subscription", service.getById(id));
        return "subscription-form";
    }

    @PostMapping("/delete/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "redirect:/subscriptions";
    }

    @PostMapping("/cancel/{id}")
    public String cancel(@PathVariable Long id) {
        service.cancel(id);
        return "redirect:/subscriptions";
    }
}
