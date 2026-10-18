
package com.example.subscriptionreminder.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }

    @GetMapping("/signup")
    public String signup() {
        return "forward:/signup.html";
    }

    @GetMapping("/subscriptions")
    public String subscriptions() {
        return "forward:/subscriptions.html";
    }

    @GetMapping("/subscription-form")
    public String subscriptionForm() {
        return "forward:/subscription-form.html";
    }
}
