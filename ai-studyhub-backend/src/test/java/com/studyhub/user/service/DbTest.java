package com.studyhub.user.service;

import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

@SpringBootTest
@ActiveProfiles("dev")
public class DbTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void printUsers() {
        System.out.println("====== DBTEST START ======");
        List<User> users = userRepository.findAll();
        for (User u : users) {
            System.out.println("EMAIL: " + u.getEmail() + " | STATUS: " + u.getStatus() + " | ID: " + u.getId());
        }
        System.out.println("====== DBTEST END ======");
    }
}
