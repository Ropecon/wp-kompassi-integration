<?php
/**
 *  Plugin Name: Kompassi Integration
 *  Description: Integrate data from Kompassi to your WordPress site easily
 *  Author: Pasi Lallinaho
 *  Version: 2025-06-15.2
 *  Text Domain: kompassi-integration
 *
 */


class WP_Plugin_Kompassi_Integration {
	private string $ver;
	private string $icon;
	private array $icons;
	private object $event;

	function __construct( ) {
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_block_assets' ) );
		add_action( 'body_class', array( $this, 'body_class' ), 10, 2 );
		add_filter( 'block_categories_all', array( $this, 'block_categories_all' ), 10, 2 );
		add_action( 'rest_api_init', array( $this, 'rest_api_init' ) );

		add_filter( 'kompassi_program_value_times', array( $this, 'kompassi_program_value_times' ), 10, 2 );
		add_filter( 'kompassi_program_value_time_start', array( $this, 'kompassi_program_value_time_start' ), 10, 2 );
		add_filter( 'kompassi_program_value_location_if_not_room', array( $this, 'kompassi_program_value_location_if_not_room' ), 10, 2 );

		$this->ver = time( );
		$this->icon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcyIgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICB3aWR0aD0iMTE2LjUzOTMzIgogICBoZWlnaHQ9IjExNi41MzkzMyIKICAgdmlld0JveD0iMCAwIDExNi41MzkzMyAxMTYuNTM5MzMiCiAgIHNvZGlwb2RpOmRvY25hbWU9Ik1PRC1mYXZpY29uLXdoaXRlLnBuZy5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMS4yICgwYTAwY2Y1MzM5LCAyMDIyLTAyLTA0KSIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcwogICAgIGlkPSJkZWZzNiI+PGNsaXBQYXRoCiAgICAgICBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIKICAgICAgIGlkPSJjbGlwUGF0aDE2Ij48cGF0aAogICAgICAgICBkPSJNIDAsODcuNDA0IEggODcuNDA0IFYgMCBIIDAgWiIKICAgICAgICAgaWQ9InBhdGgxNCIgLz48L2NsaXBQYXRoPjwvZGVmcz48c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9Im5hbWVkdmlldzQiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iMCIKICAgICBzaG93Z3JpZD0iZmFsc2UiCiAgICAgaW5rc2NhcGU6em9vbT0iNS4wOTY5OTE3IgogICAgIGlua3NjYXBlOmN4PSI0NC42MzQxNzEiCiAgICAgaW5rc2NhcGU6Y3k9IjU4LjM2Nzc2MiIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJnOCIgLz48ZwogICAgIGlkPSJnOCIKICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgIGlua3NjYXBlOmxhYmVsPSJmYXZpY29uLWRhcmsiCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzMzMzMzLDAsMCwtMS4zMzMzMzMzLDAsMTE2LjUzOTMzKSI+PGcKICAgICAgIGlkPSJnMTIiCiAgICAgICBjbGlwLXBhdGg9InVybCgjY2xpcFBhdGgxNikiCiAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIj48ZwogICAgICAgICBpZD0iZzE4IgogICAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1Ni4xMjQzLDQ1LjgzMzMpIgogICAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIj48cGF0aAogICAgICAgICAgIGQ9Im0gMCwwIGMgLTEuMTI4LC0yLjA4NSAtMi4xODMsLTQuMDQ3IC0zLjA3NCwtNS43MiAtMi4xMDgsLTMuOTU3IC01LjkzMiwtNy4wMjQgLTEwLjgyMSwtNi4zMjcgLTAuOTE0LDAuMTMgLTEuNzg3LDAuMzk1IC0yLjYwNywwLjc2MiBsIC0xLjMzNywwLjcyNCBjIC0xLjIwOCwwLjc3OSAtMi4yMzgsMS44MTEgLTMuMDE3LDMuMDE4IGwgLTAuNzE3LDEuMzI1IGMgLTAuMzcxLDAuODI4IC0wLjYzOCwxLjcxIC0wLjc2OCwyLjYzNCAtMC41OTEsNC4xOTggMS42MzEsNy41MzMgNC43NSw5Ljc4MSBMIDkuMjU4LDE5LjYwMiBaIE0gMzEuMDI2LC0xLjc1MyA2LjcxLDguMTYgMTIuNTExLDIwLjQ0MiBjIDAuMzM5LDAuNjczIDAuMTg5LDEuNDk4IC0wLjM4MiwyLjA2OCAtMC41NzUsMC41NzUgLTEuNDA4LDAuNzIyIC0yLjA4NCwwLjM3MyBsIC0xMi4xMDksLTYuMDQ2IC05Ljk4LDI0LjQ4IGMgLTAuMTM4LDAuMzM5IC0wLjYxOCwwLjMzOSAtMC43NTYsMCBsIC0xMC42NDYsLTI2LjExNSAtMTIuMTg3LDYuNTk5IGMgLTAuMzg2LDAuMjA5IC0wLjkzLC0wLjMzNSAtMC43MjEsLTAuNzIxIEwgLTI5Ljc1NSw4Ljg5MyAtNTUuODcsLTEuNzUzIGMgLTAuMzM5LC0wLjEzOCAtMC4zMzksLTAuNjE4IDAsLTAuNzU2IGwgMjYuMTE1LC0xMC42NDYgLTYuNTk5LC0xMi4xODcgYyAtMC4yMDksLTAuMzg2IDAuMzM1LC0wLjkzIDAuNzIxLC0wLjcyMSBsIDEyLjE4Nyw2LjU5OSAxMC42NDYsLTI2LjExNSBjIDAuMTM4LC0wLjMzOSAwLjYxOCwtMC4zMzkgMC43NTYsMCBsIDEwLjY0NiwyNi4xMTUgMTIuMTg3LC02LjU5OSBjIDAuMzg2LC0wLjIwOSAwLjkzLDAuMzM1IDAuNzIxLDAuNzIxIGwgLTYuNTk5LDEyLjE4NyAyNi4xMTUsMTAuNjQ2IGMgMC4zMzksMC4xMzggMC4zMzksMC42MTggMCwwLjc1NiIKICAgICAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIgogICAgICAgICAgIGlkPSJwYXRoMjAiIC8+PC9nPjxnCiAgICAgICAgIGlkPSJnMjIiCiAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQzLjc0Myw0OC4yMjg3KSIKICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZiI+PHBhdGgKICAgICAgICAgICBkPSJtIDAsMCBjIC0yLjQ5NiwwIC00LjUyNiwtMi4wMyAtNC41MjYsLTQuNTI2IDAsLTIuNDk2IDIuMDMsLTQuNTI3IDQuNTI2LC00LjUyNyAyLjQ5NiwwIDQuNTI2LDIuMDMxIDQuNTI2LDQuNTI3IEMgNC41MjYsLTIuMDMgMi40OTYsMCAwLDAiCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIKICAgICAgICAgICBpZD0icGF0aDI0IiAvPjwvZz48L2c+PC9nPjwvc3ZnPgo=';
	}

	function init( ) {
		load_plugin_textdomain( 'kompassi-integration', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

		register_block_type(
			'kompassi-integration/schedule',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'is_dynamic' => true,
				'render_callback' => array( &$this, 'block_schedule' ),
				'attributes' => array(
					'showToolbar' => array( 'type' => 'boolean', 'default' => 'true' ),
					'eventSlug' => array( 'type' => 'string', 'default' => '' ),
					'defaultFilters' => array( 'type' => 'string', 'default' => '' ),
					'timelineGrouping' => array( 'type' => 'string', 'default' => '' ),
					'timetablePrimaryGrouping' => array( 'type' => 'string', 'default' => '' ),
					'timetableSecondaryGrouping' => array( 'type' => 'string', 'default' => '' ),
				),
			)
		);

		register_block_type(
			'kompassi-integration/dimension-list',
			array(
				'editor_script' => 'kompassi-integration-blocks',
				'is_dynamic' => true,
				'render_callback' => array( $this, 'block_dimension_list' ),
				'attributes' => array(
					'eventSlug' => array( 'type' => 'string', 'default' => '' ),
				)
			)
		);
	}

	function admin_init( ) {
		add_settings_section( 'kompassi-integration-general', '', '', 'kompassi_integration_settings' );

		$fields = array(
			'event_slug' => array(
				'label' => __( 'Event Technical Name', 'kompassi-integration' ),
				'description' => __( 'Technical name for the event in Kompassi (eg. tracon2024).', 'kompassi-integration' )
			),
			'contact' => array(
				'label' => __( 'Contact', 'kompassi-integration' ),
				'description' => __( 'Email address for contacts (eg. errors in the program data).', 'kompassi-integration' )
			),
			'caching' => array(
				'label' => __( 'Cache', 'kompassi-integration' ),
				'type' => 'dropdown',
				'options' => array(
					'none' => _x( 'None', 'caching: none', 'kompassi-integration' ),
					'transient' => _x( 'Transient', 'caching: transient', 'kompassi-integration' )
				),
				'description' => __( 'Method used for caching.', 'kompassi-integration' ) . ' ' .
					'<a href="' . menu_page_url( 'kompassi_integration_settings', false ) . '&action=clear_cache">' . __( 'Clear cache now', 'kompassi-integration' ) . '</a>.',
			),
			'color_scheme' => array(
				'label' => __( 'Color Scheme', 'kompassi-integration' ),
				'type' => 'dropdown',
				'options' => array(
					'auto' => _x( 'Automatic (user preference)', 'color scheme: follow user browser preference', 'kompassi-integration' ),
					'light' => _x( 'Light', 'color scheme: light', 'kompassi-integration' ),
					'dark' => _x( 'Dark', 'color scheme: dark', 'kompassi-integration' ),
				)
			),
			'schedule_start_of_day' => array(
				'label' =>  __( 'Start of Day', 'kompassi-integration' ),
				'description' => __( 'The earliest time shown when filtering programs by date.', 'kompassi-integration' )
			),
			'schedule_end_of_day' => array(
				'label' =>  __( 'End of Day', 'kompassi-integration' ),
				'description' => __( 'The latest time shown when filtering programs by date, eg. only programs that start before this hour will be visible.', 'kompassi-integration' )
			),
			'hidden_dimensions' => array(
				'label' => __( 'Hidden Dimensions', 'kompassi-integration' ),
				'description' => __( 'Comma-separated list of dimension slugs that should be hidden from filters.', 'kompassi-integration' )
			),
			'hidden_annotations' => array(
				'label' => __( 'Hidden Annotations', 'kompassi-integration' ),
				'description' => __( 'Comma-separated list of annotation fields that should be hidden.', 'kompassi-integration' )
			),
		);

		foreach( $fields as $key => $data ) {
			$data['field_name'] = 'kompassi_integration_' . $key;
			if( !isset( $data['type'] ) ) {
				$data['type'] = 'text';
				$data['sanitize_callback'] = 'sanitize_text_field';
			}
			add_settings_field( 'kompassi_integration_' . $key, $data['label'], array( &$this, 'setting_field' ), 'kompassi_integration_settings', 'kompassi-integration-general', $data );
			register_setting( 'kompassi_integration_settings', $data['field_name'], $data );
		}
	}

	function admin_menu( ) {
		add_menu_page( __( 'Kompassi Integration', 'kompassi-integration' ), 'Kompassi', 'manage_options', 'kompassi_integration_settings', array( &$this, 'admin_page_settings' ), $this->icon, 100 );
	}

	function admin_page_settings( ) {
		if( !current_user_can( 'manage_options' ) ) {
			return;
		}
		if( isset( $_GET['action'] ) && $_GET['action'] == 'clear_cache' ) {
			$info = $this->clear_schedule_cache( );
			if( strlen( $info ) > 0 ) {
    			echo '<div class="notice notice-success is-dismissible"><p>' . $info . '</p></div>';
			}
		}
		echo '<div class="wrap"><form action="options.php" method="POST">';
		echo '<h1>' . __( 'Kompassi Integration', 'kompassi-integration' ) . '</h1>';
		settings_fields( 'kompassi_integration_settings' );
		do_settings_sections( 'kompassi_integration_settings' );
		submit_button( __( 'Save Changes', 'kompassi-integration' ) );
		echo '</form></div>';
	}

	function setting_field( $data ) {
		switch( $data['type'] ) {
			case 'dropdown':
				$current = get_option( $data['field_name'] );
				echo '<p>';
				echo '<select name="' . $data['field_name'] . '">';
				foreach( $data['options'] as $v => $l ) {
					echo '<option value="' . $v . '" ' . selected( $current, $v, false ) . '>' . $l . '</option>';
				}
				echo '</select>';
				echo '</p>';
				break;
			default:
				echo '<p><input type="text" id="' . $data['field_name'] . '" name="' . $data['field_name'] . '" class="widefat" value="' . get_option( $data['field_name'] ) . '"/></p>';
				break;
		}
		if( isset( $data['description'] ) ) {
			echo '<p class="description">' . $data['description'] . '</p>';
		}
	}

	function enqueue_block_assets( ) {
		wp_register_script( 'kompassi-integration-blocks', plugins_url( 'js/blocks.js', __FILE__ ), array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-i18n' ), $this->ver );
		wp_set_script_translations( 'kompassi-integration-blocks', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );

		if( !is_admin( ) ) {
			// Scripts: Libraries
			wp_register_script( 'dayjs', plugins_url( 'lib/dayjs.bundle.min.js', __FILE__ ), array( ), '1.11.13' );
			wp_register_script( 'hammer', plugins_url( 'lib/hammer.min.js', __FILE__ ), array( ), '2.0.8' );
			wp_register_script( 'showdown', plugins_url( 'lib/showdown.min.js', __FILE__ ), array( ), '2.1.0' );

			// Scripts: Common frontend
			wp_register_script( 'kompassi-integration-frontend-common', plugins_url( 'js/frontend-common.js', __FILE__ ), array( 'wp-hooks' ), $this->ver );
			wp_set_script_translations( 'kompassi-integration-frontend-common', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );
			$js_strings = array(
				'rest_url_base' => rest_url( ),
				'rest_nonce' => wp_create_nonce( 'wp_rest' ),
				'event_slug' => get_option( 'kompassi_integration_event_slug' ),
			);
			wp_localize_script( 'kompassi-integration-frontend-common', 'kompassi_common', $js_strings );

			// Styles
			wp_register_style( 'kompassi-integration-fonts', plugins_url( 'fonts/fonts.css', __FILE__ ), array( ), $this->ver );
			wp_register_style( 'kompassi-integration-frontend-common', plugins_url( 'css/frontend-common.css', __FILE__ ), array( 'kompassi-integration-fonts' ), $this->ver );

			// SCHEDULE BLOCK
			if( has_block( 'kompassi-integration/schedule' ) ) {
				wp_enqueue_script( 'kompassi-integration-schedule', plugins_url( 'js/schedule.js', __FILE__ ), array( 'kompassi-integration-frontend-common', 'wp-hooks', 'wp-i18n', 'dayjs', 'hammer', 'showdown' ), $this->ver );
				wp_set_script_translations( 'kompassi-integration-schedule', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );
				$js_strings = array(
					'locale' => get_locale( ),
					'start_of_day' => (int) get_option( 'kompassi_integration_schedule_start_of_day', 0 ),
					'end_of_day' => (int) get_option( 'kompassi_integration_schedule_end_of_day', 0 ),
					'hidden_dimensions' => explode( ',', get_option( 'kompassi_integration_hidden_dimensions', '' ) ),
					'timeline_grouping' => get_option( 'kompassi_integration_timeline_grouping' ),
					'search_targets' => apply_filters( 'kompassi_schedule_search_targets', array( 'title' => 100, 'cachedHosts' => 10, 'description' => 1 ) ),
				);
				wp_localize_script( 'kompassi-integration-schedule', 'kompassi_schedule_options', $js_strings );

				wp_enqueue_style( 'kompassi-integration-schedule', plugins_url( 'css/schedule.css', __FILE__ ), array( 'kompassi-integration-frontend-common' ), $this->ver );
			}

			// DIMENSION LIST BLOCK
			if( has_block( 'kompassi-integration/dimension-list' ) ) {
				wp_enqueue_style( 'kompassi-integration-dimension-list', plugins_url( 'css/dimension-list.css', __FILE__ ), array( 'kompassi-integration-frontend-common' ), $this->ver );
			}
		} else {
			wp_enqueue_style( 'kompassi-integration-editor', plugins_url( 'css/editor.css', __FILE__ ), array( ), $this->ver );
		}
	}

	function block_categories_all( $categories, $editor_context ) {
		if( !$editor_context instanceof WP_Block_Editor_Context ) {
			return $categories;
		}

		$categories[] = array(
			'slug' => 'kompassi',
			'title' => 'Kompassi',
		);

		return $categories;
	}

	function body_class( $classes ) {
		// TODO: Depending on color scheme attribution, add classname
		$scheme = get_option( 'kompassi_integration_color_scheme' );
		$classes[] = 'kompassi-color-scheme-' . sanitize_key( $scheme );
		return $classes;
	}

	/*
	 *  Fetch data from GraphQL
	 *
	 */

	function get_graphql( $type, $event_slug ) {
		$type = preg_replace( '/[^a-zA-Z]/', '', $type );
		$file = plugin_dir_path( __FILE__ ) . 'graphql/' . $type . '.gql';
		if( !is_readable( $file ) ) {
			return false;
		}
		$query = array(
			'query' => file_get_contents( $file ),
			'variables' => array(
				'eventSlug' => $event_slug,
				'locale' => get_locale( )
			)
		);
		$options = array(
			'http' => array(
				'method' => 'POST',
				'content' => json_encode( $query ),
				'header' => "Content-Type: application/json\r\n" .
					"Accept: application/json\r\n"
			)
		);
		$context = stream_context_create( $options );
		$json = file_get_contents( 'https://kompassi.eu/graphql', false, $context );
		$response = json_decode( $json, true );

		return $response;
	}

	/*
	 *  Docs REST
	 *
	 */

	function rest_api_init( ) {
		register_rest_route(
			'kompassi-integration/v1',
			'/docs/(?P<document>\S+)/(?P<locale>\S+)',
			array(
				'methods' => 'GET',
				'callback' => array( &$this, 'rest_callback_docs' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	function rest_callback_docs( WP_REST_Request $request ) {
		$parameters = $request->get_params( );

		$filename = realpath( plugin_dir_path( __FILE__ ) . 'docs/' . $parameters['document'] . '_' . $parameters['locale'] . '.md' );
		if( $filename != false ) {
			if( substr( $filename, 0, strlen( plugin_dir_path( __FILE__ ) ) ) != plugin_dir_path( __FILE__ ) ) {
				return array( 'status' => false, 'fn' => $fn );
			}
		}

		if( $filename == false || !is_readable( $filename ) ) {
			// Specified document is not available in given language, try English
			$filename_en = realpath( plugin_dir_path( __FILE__ ) . 'docs/' . $parameters['document'] . '_en.md' );
			if( $filename_en == false || !is_readable( $filename_en ) ) {
				// Specified document is not available in English, return false
				return array( 'status' => false );
			} else {
				$filename = $filename_en;
			}
		}
		$doc = file_get_contents( $filename );
		$doc = apply_filters( 'kompassi_document_' . $parameters['document'], $doc, $parameters );

		return array( 'status' => true, 'content' => $doc );
	}

	/*
	 *  Fetch processed schedule cache
	 *
	 */

	function get_schedule_cache( $event_slug ) {
		switch( get_option( 'kompassi_integration_caching' ) ) {
			case 'transient':
				$transient = get_site_transient( 'kompassi_integration_schedule_' . $event_slug . '_' . get_locale( ) );
				if( $transient ) {
					return $transient;
				}
				break;
		}
		return false;
	}

	/*
	 *  Save processed schedule cache
	 *
	 */

	function save_schedule_cache( $data, $event_slug ) {
		$cache_time_in_min = 5;
		switch( get_option( 'kompassi_integration_caching' ) ) {
			case 'transient':
				set_site_transient( 'kompassi_integration_schedule_' . $event_slug . '_' . get_locale( ), $data, $cache_time_in_min * 60 );
				break;
		}
	}

	/*
	 *  Clear processed schedule cache
	 *
	 */

	function clear_schedule_cache( ) {
		$info = '';

		// Transients
		global $wpdb;
		$transients = $wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE '_site_transient_kompassi_integration_schedule_%'" );
		if( $transients > 0 ) {
			# translators: amount of transients deleted
			$info .= sprintf( _n( '%s transient deleted.', '%s transients deleted.', $transients, 'kompassi-integration' ), $transients );
		}

		return $info;
	}

	/*
	 *  Show the schedule block
	 *
	 */

	function block_schedule( $attributes ) {
		if( strlen( $attributes['eventSlug'] ) > 0 ) {
			$event_slug = $attributes['eventSlug'];
		} else {
			$event_slug = get_option( 'kompassi_integration_event_slug' );
		}
		if( strlen( $event_slug ) < 1 ) {
			return;
		}

		// Get cache
		$cached_data = $this->get_schedule_cache( $event_slug );
		if( $cached_data ) {
			return $cached_data;
		}

		$html_attrs = array( 'class' => 'kompassi-integration' );
		if( isset( $attributes['align'] ) ) { $html_attrs['class'] .= ' align' . $attributes['align']; }

		$out = '<div id="kompassi_block_schedule" ' . get_block_wrapper_attributes( $html_attrs ) . ' ' . wp_interactivity_data_wp_context( $attributes ) . '>';

		/*  Schedule  */
		$graphql = $this->get_graphql( 'ScheduleQuery', $event_slug );
		if( !$graphql ) {
			return;
		}
		$data = apply_filters( 'kompassi_schedule_data', $graphql['data']['event'] );
		if( count( $data ) < 1 ) {
			return;
		}

		$out .= '<section class="kompassi_schedule_wrapper">';
		$out .= '<section id="kompassi_schedule" data-display="list" data-start="' . $data['startTime'] . '" data-end="' . $data['endTime'] . '" data-timezone="' . $data['timezone'] . '">';

		// Map dimension value labels and flags to arrays
		$this->event->dimensions = $this->get_dimension_values( $data['program']['dimensions'] );

		// Map annotation labels and flags to arrays
		$this->event->annotations = array( );
		foreach( $data['program']['annotations'] as $annotation ) {
			$this->event->annotations[$annotation['slug']] = $annotation;
		}

		// Get a list of hidden dimensions and annotations
		$options = array( );
		$options['hidden_dimensions'] = explode( ',', get_option( 'kompassi_integration_hidden_dimensions', '' ) );
		$options['hidden_annotations'] = explode( ',', get_option( 'kompassi_integration_hidden_annotations', '' ) );

		// Check which icons are available
		$icons_path = plugin_dir_path( __FILE__ ) . 'images/icons';
		if( is_readable( $icons_path ) ) {
			foreach( scandir( $icons_path ) as $icon ) {
				if( $icon != '.' && $icon != '..' ) {
					if( substr( $icon, -4 ) == '.svg' ) {
						$this->icons[] = basename( $icon, '.svg' );
					}
				}
			}
		}

		$scheduleitems = array( );
		foreach( $data['program']['programs'] as $program ) {
			$scheduleitems = $this->markup_scheduleitems_for_program( $scheduleitems, $program, $options );
		}
		ksort( $scheduleitems );
		foreach( $scheduleitems as $item ) {
			$out .= $item;
		}

		$out .= '</section>';
		$out .= '</section>';

		$out .= '<script>kompassi_schedule_dimensions = ' . json_encode( $data['program']['dimensions'] ) . '</script>';

		$out .= '<div class="kompassi-footer">';
		$out .= $this->contact( );
		$out .= $this->data_provided_image( );
		$out .= '</div>';
		$out .= '</div>';

		// Save cache
		$this->save_schedule_cache( $out, $event_slug );

		return $out;
	}

	/*
	 *  Return markup for all schedule items for single program event
	 *
	 */

	function markup_scheduleitems_for_program( $scheduleitems, $program, $options ) {
		// There are no scheduleItems for the program, return
		if( !is_array( $program['scheduleItems'] ) || count( $program['scheduleItems'] ) < 1 ) {
			return $scheduleitems;
		}

		//  Gather common program data
		$program_attributes = array( );
		$program_data = array( );

		//  Program color
		if( $program['color'] ) {
			$program_attributes['style'] = '--kompassi-program-color: ' . $program['color'] . ';';
		}

		//  If multiple scheduleItems...
		if( count( $program['scheduleItems'] ) > 1 ) {
			//  Parent slug
			$program_attributes['data-parent-id'] = $program['slug'];

			// Other scheduleItems as Related
			$program_data['related'] = array( );

			foreach( $program['scheduleItems'] as $index => $item ) {
				$related = $this->get_program_value( $program, 'time_start', $index, false );
				if( $item['subtitle'] ) {
					$related = $item['subtitle'] . ' (' . $related . ')';
				}
				$related = '<a class="related-link" href="#' . $item['slug'] . '">' . $related . '</a>';

				$program_data['related'][$index] = $related;
			}
		}

		//  Title and description
		$program_data['description'] = make_clickable( nl2br( $program['description'] ) );

		//  Annotations
		$annotations = array( );
		foreach( $program['cachedAnnotations'] as $field => $value ) {
			if( !in_array( $field, $options['hidden_annotations'] ) && $this->event->annotations[$field]['isShownInDetail'] !== false && $value !== false ) {
				if( $value === true ) {
					$value = _x( 'Yes', 'boolean field: true', 'kompassi-integration' );
				}
				$annotations[] = array(
					'title' => $this->event->annotations[$field]['title'],
					'description' => $value,
					'class' => 'annotation-' . str_replace( ':', '-', $field )
				);
			}
		}
		// Allow sites to programmatically add annotations
		$annotations = apply_filters( 'kompassi_program_annotations', $annotations, $program );
		if( count( $annotations ) > 0 ) {
			ob_start( );
			echo '<dl class="kompassi-annotations">';
			foreach( $annotations as $annotation ) {
				echo '<dt class="' . $annotation['class'] . '">' . $annotation['title'] . '</dt>';
				foreach( (array) $annotation['description'] as $desc ) {
					echo '<dd class="' . $annotation['class'] . '">' . $desc . '</dd>';
				}
			}
			echo '</dl>';
			$program_data['annotations'] = ob_get_clean( );
		}

		//  Dimensions
		$program_data['dimensions'] = array( );
		foreach( $program['cachedDimensions'] as $dimension => $values ) {
			if( in_array( $dimension, $options['hidden_dimensions'] ) ) {
				continue;
			}

			if( count( $values ) > 0 ) {
				if( $dimension == 'state' ) {
					if( $values[0] == 'canceled' ) {
						$program_attributes['data-state'] == 'canceled';
					}
					continue;
				}
				if( !isset( $this->event->dimensions[$dimension] ) ) {
					continue;
				}

				$attr = 'data-' . $dimension;
				$program_attributes[$attr] = implode( ',', $values );

				if( !$this->event->dimensions[$dimension]['flags']['isShownInDetail'] ) {
					continue;
				}

				$program_data['dimensions'][$dimension] = $this->get_dimension_output( $dimension, $values );
			}
		}

		//  Actions
		$program_data['actions'] = '';
		foreach( $program['links'] as $link ) {
			$class = strtolower( $link['type'] );
			if( in_array( strtolower( $link['type'] ), $this->icons ) ) {
				$class .= ' kompassi-icon-' . strtolower( $link['type'] );
			}
			$program_data['actions'] .= '<a href="' . $link['href'] . '" class="' . $class . '" title="' . $link['title'] . '"></a>';
		}

		// Output
		foreach( $program['scheduleItems'] as $scheduleItem_index => $scheduleItem ) {
			ob_start( );
			// Gather scheduleItem specific data
			$program_attributes['data-id'] = $scheduleItem['slug'];
			$program_attributes['data-start'] = $scheduleItem['startTime'];
			$program_attributes['data-end'] = $scheduleItem['endTime'];
			$program_attributes['data-length'] = $scheduleItem['lengthMinutes'];

			// Get dimension attributes from scheduleItem
			foreach( $scheduleItem['cachedDimensions'] as $dimension => $values ) {
				$attr = 'data-' . $dimension;
				$program_attributes[$attr] = implode( ',', $values );
			}

			// Convert attrs to HTML attrs
			$html_attrs = '';
			foreach( $program_attributes as $attr => $value ) {
				$html_attrs .= ' ' . $attr . '="' . $value . '"';
			}
			?>
				<article id="<?php echo $scheduleItem['slug']; ?>" class="kompassi-program" <?php echo $html_attrs; ?>>
					<details>
						<summary>
							<div class="title" style="grid-area: title;"><?php echo $scheduleItem['title']; ?></div>
							<div class="secondary" style="grid-area: secondary;">
								<?php
									//  Get summary fields; this needs to be done here, as fields can be dependent of scheduleItem data
									//  TODO: If these fields refer to fields that are not loaded in the default GraphQL, make sure to append them to the query
									$fields_in_summary = apply_filters( 'kompassi_schedule_fields_in_summary', array( 'times', 'location' ) );
									foreach( $fields_in_summary as $key ) {
										echo $this->get_program_value( $program, $key, $scheduleItem_index );
									}
								?>
							</div>
						</summary>
						<section>
							<div class="main" style="grid-area: main;">
								<div class="description"><?php echo $program_data['description']; ?></div>
								<?php
									if( isset( $program_data['related'] ) ) {
										echo '<div class="related">';
										echo '<dl>';
										echo '<dt>' . __( 'Related', 'kompassi-integration' ) . '</dt>';
										echo '<dd>';
											$show = $program_data['related'];
											unset( $show[$scheduleItem_index] );
											echo implode( '<br />', $show );
										echo '</dd>';
										echo '</dl>';
										echo '</div>';
									}
								?>
								<?php if( isset( $program_data['annotations'] ) ) { ?>
									<div class="annotations" style="grid-area: annotations;"><?php echo $program_data['annotations']; ?></div>
								<?php } ?>
							</div>
							<div class="meta" style="grid-area: meta;">
								<?php
									//  Get meta; this needs to be done here, as fields can be dependent of scheduleItem data
									$show_meta_fields = apply_filters( 'kompassi_schedule_fields_in_meta', array( 'times', 'cachedHosts', 'location_if_not_room' ) );
									foreach( $show_meta_fields as $key ) {
										echo $this->get_program_value( $program, $key, $scheduleItem_index );
									}
 								?>
								<div class="kompassi-dimensions">
									<?php
										$dimensions = array_merge( array_keys( $program_data['dimensions'] ), array_keys( $scheduleItem['cachedDimensions'] ) );
										foreach( $dimensions as $dimension ) {
											if( isset( $scheduleItem['cachedDimensions'][$dimension] ) ) {
												echo $this->get_dimension_output( $dimension, $scheduleItem['cachedDimensions'][$dimension] );
											} else {
												echo $program_data['dimensions'][$dimension];
											}
										}

									?>
								</div>
							</div>
							<div class="actions" style="grid-area: actions;"><?php echo $program_data['actions']; ?></div>
						</section>
					</details>
				</article>
			<?php
			$key = $scheduleItem['startTime'] . '-' . $scheduleItem['title'];
			$scheduleitems[$key] = ob_get_clean();
		}
		return $scheduleitems;
	}

	/**
	 *  Returns dimension output
	 *
	 */

	function get_dimension_output( $dimension, $values ) {
		ob_start( );
		echo '<div class="dimension ' . $dimension . '" title="' . $this->event->dimensions[$dimension]['title'] . '">';
		foreach( $values as $slug ) {
			if( isset( $this->event->dimensions[$dimension]['value_labels'][$slug] ) ) {
				echo '<span class="value">' . $this->event->dimensions[$dimension]['value_labels'][$slug] . '</span> ';
			} else {
				echo '<span class="value">' . $slug . '</span> ';
			}
		}
		echo '</div>';
		return ob_get_clean( );
	}

	/**
	 *  Returns a program (or scheduleItem) field, dimension or annotation value
	 *
	 */

	function get_program_value( $program, $key, $scheduleItem_index = false, $wrap = true ) {
		if( isset( $program['scheduleItems'] ) && $scheduleItem_index !== false ) {
			$scheduleItem = $program['scheduleItems'][$scheduleItem_index];
		}
		$value = '';
		if( ( isset( $scheduleItem ) && isset( $scheduleItem[$key] ) ) || isset( $program[$key] ) ) {
			if( ( isset( $scheduleItem ) && isset( $scheduleItem[$key] ) ) ) {
				$value = $scheduleItem[$key];
			} else {
				$value = $program[$key];
			}
			if( is_array( $value ) ) {
				$value = implode( ',', $value );
			}
		} elseif( isset( $program['cachedDimensions'][$key] ) ) {
			$values = array( );
			foreach( $program['cachedDimensions'][$key] as $dimension_value_slug ) {
				$values[] = $this->event->dimensions[$key]['value_labels'][$dimension_value_slug];
			}
			$value = implode( ', ', $values );
		} elseif( isset( $program['cachedAnnotations'][$key] ) ) {
			$value = $program['cachedAnnotations'][$key];
		} elseif( isset( $scheduleItem ) ) {
			$value = apply_filters( 'kompassi_program_value_' . $key, '', $scheduleItem );
		}
		if( isset( $value ) && strlen( $value ) > 0 ) {
			if( $wrap ) {
				return '<div class="' . $key . '">' . $value . '</div>';
			} else {
				return $value;
			}
		}
	}

	function kompassi_program_value_times( $value, $scheduleItem ) {
		$timezone = wp_timezone( );
		$start = DateTimeImmutable::createFromFormat( DateTimeInterface::ISO8601, $scheduleItem['startTime'], $timezone );
		$end = DateTimeImmutable::createFromFormat( DateTimeInterface::ISO8601, $scheduleItem['endTime'], $timezone );

		$start_timestamp = $start->format( 'U' ) + $timezone->getOffset( $start );
		$end_timestamp = $end->format( 'U' ) + $timezone->getOffset( $end );

		$value = '<span>' . date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $start_timestamp ) . '</span>';
		$value .= ' – ';
		if( date_i18n( 'Ymd', $start_timestamp ) == date_i18n( 'Ymd', $end_timestamp ) ) {
			$value .= '<span>' . date_i18n( get_option( 'time_format' ), $end_timestamp ) . '</span>';
		} else {
			// If multiday, show both days
			$value .= '<span>' . date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $end_timestamp ) . '</span>';
		}
		$value .= ' <span class="length">';
		$h = $scheduleItem['lengthMinutes'] / 60;
		$min = $scheduleItem['lengthMinutes'] % 60;
		if( $h < 1 ) {
			$value .= $min . 'min';
		} elseif( $min == 0 ) {
			$value .= floor( $h ) . 'h';
		} else {
			$value .= floor( $h ) . 'h ' . $min . 'min';
		}
		$value .= '</span>';
		return $value;
	}

	function kompassi_program_value_time_start( $value, $scheduleItem ) {
		$timezone = wp_timezone( );
		$start = DateTimeImmutable::createFromFormat( DateTimeInterface::ISO8601, $scheduleItem['startTime'], $timezone );
		$start_timestamp = $start->format( 'U' ) + $timezone->getOffset( $start );
		$value = date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $start_timestamp );
		return $value;
	}

	function kompassi_program_value_location_if_not_room( $value, $scheduleItem ) {
		if( !isset( $scheduleItem['cachedDimensions']['room'][0] ) ) {
			return;
		}
		$scheduleItem_room = $scheduleItem['cachedDimensions']['room'][0];
		if( $scheduleItem['location'] != $this->event->dimensions['room']['value_labels'][$scheduleItem_room] ) {
			$value = $scheduleItem['location'];
		}
		return $value;
	}

	/*
	 *  Get dimension values in an array
	 *
	 */

	function get_dimension_values( $dimensions ) {
		$dimension_values = array( );
		foreach( $dimensions as $dimension ) {
			$d = array( 'value_labels' => array( ), 'flags' => array( ) );
			$d['title'] = $dimension['title'];
			foreach( $dimension['values'] as $value ) {
				$d['value_labels'][$value['slug']] = $value['title'];
				foreach( $dimension as $k => $v ) {
					if( substr( $k, 0, 2 ) == 'is' ) {
						$d['flags'][$k] = $v;
					}
				}
			}
			$dimension_values[$dimension['slug']] = $d;
		}

		return $dimension_values;
	}

	/*
	 *  Show the dimension list block
	 *
	 */

	function block_dimension_list( $attributes ) {
		if( strlen( $attributes['eventSlug'] ) > 0 ) {
			$event_slug = $attributes['eventSlug'];
		} else {
			$event_slug = get_option( 'kompassi_integration_event_slug' );
		}
		if( strlen( $event_slug ) < 1 ) {
			return;
		}

		$data = $this->get_graphql( 'ProgramDimensionListQuery', $event_slug );
		$programs = $data['data']['event']['program']['programs'];
		$dimensions = $data['data']['event']['program']['dimensions'];
		$dimension_values = $this->get_dimension_values( $dimensions );

		$html_attrs = array( 'class' => 'kompassi-integration' );
		if( isset( $attributes['align'] ) ) { $html_attrs['class'] .= ' align' . $attributes['align']; }

		$out = '<div id="kompassi_block_dimension_list"' . get_block_wrapper_attributes( $html_attrs ) . ' ' . wp_interactivity_data_wp_context( $attributes ) . '>';
		$out .= '<table class="kompassi-table">';
		$out .= '<thead>';
		$out .= '<tr>';
		$out .= '<th>' . __( 'Program', 'kompassi-integration' ) . '</th>';
		foreach( $dimensions as $dimension ) {
			$out .= '<th class="' . $dimension['slug'] . '">' . $dimension['title'] . '</th>';
		}
		$out .= '</tr>';
		$out .= '</thead>';
		$out .= '<tbody>';
		foreach( $programs as $program ) {
			foreach( $program['scheduleItems'] as $scheduleItem ) {
				$combined_dimensions = array_merge( $program['cachedDimensions'], $scheduleItem['cachedDimensions'] );
				$out .= '<tr ';
				foreach( $dimensions as $dimension ) {
					if( isset( $combined_dimensions[$dimension['slug']] )  ) {
						$out .= ' data-' . $dimension['slug'] . '="' . join( ',', $combined_dimensions[$dimension['slug']] ) . '"';
					}
				}
				$out .= '>';
				$out .= '<th>' . $program['title'] . '</th>';
				foreach( $dimensions as $dimension ) {
					$out .= '<td class="' . $dimension['slug'] . '">';
					if( isset( $combined_dimensions[$dimension['slug']] )  ) {
						$program_dimension_values = $combined_dimensions[$dimension['slug']];
						if( count( $program_dimension_values ) > 0 ) {
							$program_dimension_labels = array( );
							foreach( $program_dimension_values as $value ) {
								$program_dimension_labels[] = $dimension_values[$dimension['slug']]['value_labels'][$value];
							}
							$out .= '<span>' . join( '<br />', $program_dimension_labels ) . '</span>';
						}
					}
					$out .= '</td>';
				}
				$out .= '</tr>';
			}
		}
		$out .= '</tbody>';
		$out .= '</table>';
		$out .= '</div>';

		return $out;
	}

	/**
	 *  Returns the contact information
	 *
	 */

	function contact( ) {
		if( get_option( 'kompassi_integration_contact' ) ) {
			$out = '<div class="kompassi-contact">';
			$contact_link = '<a href="mailto:' . get_option( 'kompassi_integration_contact' ) . '">' . get_option( 'kompassi_integration_contact' ) . '</a>';
			# translators: email link
			$out .= '<p>' . sprintf( __( 'If you find errors in the program data, contact us at %s.', 'kompassi-integration' ), $contact_link ) . '</p>';
			$out .= '</div>';
			return $out;
		}
	}

	/**
	 *  Returns a "Data provided by Kompassi" image
	 *
	 */

	function data_provided_image( ) {
		return '<div class="kompassi-provided"><a href="https://kompassi.eu/"><img src="' . plugins_url( '/images/kompassi_provided.svg', __FILE__ ) . '" alt="Data provided by Kompassi" /></a></div>';
	}
}

new WP_Plugin_Kompassi_Integration( );
