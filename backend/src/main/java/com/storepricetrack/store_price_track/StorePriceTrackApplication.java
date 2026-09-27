package com.storepricetrack.store_price_track;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StorePriceTrackApplication {

	public static void main(String[] args) {
		SpringApplication.run(StorePriceTrackApplication.class, args);
	}

}
