package com.homeval.analysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class HomevalAnalysisApplication {

	public static void main(String[] args) {
		SpringApplication.run(HomevalAnalysisApplication.class, args);
	}

}
