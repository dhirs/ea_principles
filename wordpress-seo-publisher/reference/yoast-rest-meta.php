<?php
/**
 * Plugin Name: Yoast REST Meta (Claude Publisher)
 * Description: Exposes Yoast SEO focus keyword, SEO title, and meta description to the WordPress REST API so they can be set programmatically when creating a post. Drop this file into wp-content/mu-plugins/ (create the folder if it does not exist). No activation needed — must-use plugins load automatically.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'init', function () {
    $fields = array(
        '_yoast_wpseo_focuskw',
        '_yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
    );

    foreach ( $fields as $key ) {
        register_post_meta( 'post', $key, array(
            'type'          => 'string',
            'single'        => true,
            'show_in_rest'  => true,
            // Only users who can edit the post may write these via REST.
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ) );
    }
} );
