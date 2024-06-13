<?php
/**
 *  Plugin Name: Kompassi Integration
 *  Description: Integrate data from Kompassi to your WordPress site easily
 *  Author: Pasi Lallinaho
 *  Version: 2024-06-12
 *  Text Domain: kompassi-integration
 *
 */


class WP_Plugin_Kompassi_Integration {
	private string $ver;
	private array $icons;

	function __construct( ) {
		add_action( 'init', array( &$this, 'init' ) );
		add_action( 'admin_init', array( &$this, 'admin_init' ) );
		add_action( 'admin_menu', array( &$this, 'admin_menu' ) );
		add_action( 'enqueue_block_assets', array( &$this, 'enqueue_block_assets' ) );
		add_filter( 'block_categories_all', array( &$this, 'block_categories_all' ), 10, 2 );

		$this->ver = time( );
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
					'default_display' => array( 'type' => 'string', 'default' => 'list' ),
				),
			)
		);
	}

	function admin_init( ) {
		add_settings_section( 'kompassi-integration-general', '', '', 'kompassi_integration_settings' );

		$fields = array(
			'event_slug' => array(
				'label' => __( 'Event Slug', 'kompassi-integration' ),
				'description' => __( 'Event slug in Kompassi.', 'kompassi-integration' )
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
			'schedule_start_of_day' => array(
				'label' =>  __( 'Start of Day', 'kompassi-integration' ),
				'description' => __( 'Start of Day when a single day is shown.', 'kompassi-integration' )
			),
			'schedule_end_of_day' => array(
				'label' =>  __( 'End of Day', 'kompassi-integration' ),
				'description' => __( 'End of Day when a single day is shown.', 'kompassi-integration' )
			),
			'hidden_dimensions' => array(
				'label' => __( 'Hidden Dimensions', 'kompassi-integration' ),
				'description' => __( 'Comma-separated list of dimension slugs that should be hidden from filters.', 'kompassi-integration' )
			),
			'otherfields_visible' => array(
				'label' => __( 'Other Fields', 'kompassi-integration' ),
				'description' => __( 'Comma-separated list of otherFields fields that should be shown.', 'kompassi-integration' )
			),
			'timeline_grouping' => array(
				'label' => __( 'Timeline Grouping', 'kompassi-integration' ),
				'description' => __( 'Dimension slug for the dimension that should be used to group program with subheadings in timeline.', 'kompassi-integration' )
			)
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
		add_menu_page( __( 'Kompassi Integration', 'kompassi-integration' ), 'Kompassi', 'manage_options', 'kompassi_integration_settings', array( &$this, 'admin_page_settings' ), 'dashicons-book', 100 );
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
			wp_register_script( 'kompassi-integration-frontend-common', plugins_url( 'js/frontend-common.js', __FILE__ ), array( ), $this->ver );
			wp_register_script( 'dayjs', plugins_url( 'lib/dayjs.min.js', __FILE__ ), array( ), '1.11.10' );
			wp_register_script( 'hammer', plugins_url( 'lib/hammer.min.js', __FILE__ ), array( ), '2.0.8' );
			wp_register_script( 'js-cookie', plugins_url( 'lib/js.cookie.min.js', __FILE__ ), array( ), '3.0.5' );
			wp_register_script( 'jquery-multiselect', plugins_url( 'lib/jquery.multiselect.js', __FILE__ ), array( 'jquery' ), '2.4.23' );

			wp_register_style( 'kompassi-integration-fonts', plugins_url( 'fonts/fonts.css', __FILE__ ), array( ), $this->ver );
			wp_register_style( 'kompassi-integration-frontend-common', plugins_url( 'css/frontend-common.css', __FILE__ ), array( 'kompassi-integration-fonts'), $this->ver );
			wp_register_style( 'jquery-multiselect', plugins_url( 'lib/jquery.multiselect.css', __FILE__ ), array( ), '2.4.23' );

			if( has_block( 'kompassi-integration/schedule' ) ) {
				wp_enqueue_script( 'kompassi-integration-schedule', plugins_url( 'js/schedule.js', __FILE__ ), array( 'kompassi-integration-frontend-common', 'dayjs', 'hammer', 'js-cookie', 'jquery-multiselect', 'jquery', 'wp-i18n', 'js-cookie' ), $this->ver );
				wp_set_script_translations( 'kompassi-integration-schedule', 'kompassi-integration', plugin_dir_path( __FILE__ ) . 'languages/' );
				$js_strings = array(
					'schedule_start_of_day' => get_option( 'kompassi_integration_schedule_start_of_day', 0 ),
					'schedule_end_of_day' => get_option( 'kompassi_integration_schedule_end_of_day', 0 ),
					'hidden_dimensions' => explode( ',', get_option( 'kompassi_integration_hidden_dimensions', '' ) ),
					'timeline_grouping' => get_option( 'kompassi_integration_timeline_grouping' ),
				);
				wp_localize_script( 'kompassi-integration-schedule', 'kompassi_options', $js_strings );

				wp_enqueue_style( 'kompassi-integration-frontend', plugins_url( 'css/schedule.css', __FILE__ ), array( 'kompassi-integration-frontend-common', 'jquery-multiselect' ), $this->ver );
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

	/*
	 *  Fetch processed schedule cache
	 *
	 */

	function get_schedule_cache( ) {
		switch( get_option( 'kompassi_integration_caching' ) ) {
			case 'transient':
				$transient = get_site_transient( 'kompassi_integration_schedule_' . get_option( 'kompassi_integration_event_slug' ) . '_' . get_locale( ) );
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

	function save_schedule_cache( $data ) {
		$cache_time_in_min = 5;
		switch( get_option( 'kompassi_integration_caching' ) ) {
			case 'transient':
				set_site_transient( 'kompassi_integration_schedule_' . get_option( 'kompassi_integration_event_slug' ) . '_' . get_locale( ), $data, $cache_time_in_min * 60 );
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
	 *  Fetch data from GraphQL
	 *
	 */

	function get_schedule_data_graphql( ) {
		$query = array(
			'query' => file_get_contents( plugins_url( 'graphql/ProgramListQuery.gql', __FILE__ ) ),
			'variables' => array(
				'eventSlug' => get_option( 'kompassi_integration_event_slug' ),
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
		return $response['data']['event']['program'];
	}

	/*
	 *  Show the schedule block
	 *
	 */

	function block_schedule( $attributes ) {
		$event_slug = get_option( 'kompassi_integration_event_slug' );
		if( strlen( $event_slug ) < 1 ) {
			return;
		}

		// Get cache
		$cached_data = $this->get_schedule_cache( );
		if( $cached_data ) {
			return $cached_data;
		}

		$html_attrs = array( 'class' => '' );
		if( isset( $attributes['align'] ) ) { $html_attrs['class'] .= ' align' . $attributes['align']; }

		$out = '<div id="kompassi_block_schedule" ' . get_block_wrapper_attributes( $html_attrs ) . '>';

		/*  Schedule  */
		$out .= '<section class="kompassi_schedule_wrapper">';
		$out .= '<section id="kompassi_schedule" class="' . $attributes['default_display'] . '">';

		$data = $this->get_schedule_data_graphql( );
		if( !$data || count( $data ) < 1 ) {
			return;
		}

		$options = array( );
		// Map dimension value labels and flags to arrays
		$options['dimensions'] = array( );
		foreach( $data['dimensions'] as $dimension ) {
			$d = array( 'value_labels' => array( ), 'flags' => array( ) );
			foreach( $dimension['values'] as $value ) {
				$d['value_labels'][$value['slug']] = $value['title'];
				foreach( $dimension as $k => $v ) {
					if( substr( $k, 0, 2 ) == 'is' ) {
						$d['flags'][$k] = $v;
					}
				}
			}
			$options['dimensions'][$dimension['slug']] = $d;
		}

		// Get a list of hidden dimensions
		$options['hidden_dimensions'] = explode( ',', get_option( 'kompassi_integration_hidden_dimensions', '' ) );
		$options['otherfields_visible'] = explode( ',', get_option( 'kompassi_integration_otherfields_visible', '' ) );

		// Check which icons are avalable
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

		foreach( $data['programs'] as $p ) {
			$out .= $this->markup_program( $p, $options );
		}
		$out .= '</section>';
		$out .= '</section>';

		$out .= '<script>kompassi_schedule_dimensions = ' . json_encode( $data['dimensions'] ) . '</script>';

		/*
		 *  Program colors
		 *  Color values from dimensions later in the data will override earlier values
		 *  Philosophically, more specific tags should take precendence
		 *
		 */
		$out .= '<style>';
		foreach( $data['dimensions'] as $dimension_slug => $dimension ) {
			foreach( $dimension['values'] as $value_slug => $value ) {
				if( isset( $value['color'] ) || isset( $value['icon'] ) ) {
					$out .= ' #kompassi_schedule article[data-' . $dimension_slug . '="' .  $value_slug . '"] {';
					if( isset( $value['color'] ) ) {
						$out .= '  --kompassi-program-color: ' . $value['color'] . '; ';
					}
					if( isset( $value['icon'] ) ) {
						$out .= '  --kompassi-program-icon: url(' . $value['icon'] . '); ';
					}
					$out .= ' }';
				}
			}
		}
		$out .= '</style>';

		$out .= $this->data_provided_image( );
		$out .= '</div>';

		// Save cache
		$this->save_schedule_cache( $out );

		return $out;
	}

	/*
	 *  Return markup for a single program event
	 *
	 */

	function markup_program( $program, $options ) {
		if( !is_array( $program['scheduleItems'] ) || count( $program['scheduleItems'] ) < 1 ) {
			return;
		}

		ob_start( );
		$program['start'] = $program['scheduleItems'][0]['startTimeUnixSeconds'];
		$program['end'] = $program['scheduleItems'][0]['endTimeUnixSeconds'];
		$program['length'] = $program['scheduleItems'][0]['lengthMinutes'];
		$program['identifier'] = $program['slug'];

		$attrs = array(
			'id' => $program['identifier'],
			'length' => $program['length'], // Required for timeline calculations
			'start' => $program['start'],
			'end' => $program['end'],
		);
		foreach( $program['cachedDimensions'] as $dimension => $values ) {
			if( count( $values ) > 0 ) {
				$attrs[$dimension] = $values[0];
			}
		}

		$html_attrs = '';
		foreach( $attrs as $attr => $value ) {
			$html_attrs .= ' data-' . $attr . '="' . $value . '"';
		}
		$program['description'] = nl2br( $program['description'] );
		?>
			<article id="<?php echo $program['identifier']; ?>" class="kompassi-program" <?php echo $html_attrs; ?>>
				<div class="title" style="grid-area: title;"><?php echo $program['title']; ?></div>
				<div class="main" style="grid-area: main;">
					<div class="description">
						<?php echo $program['description']; ?>
					</div>
					<div class="other">
						<?php
							foreach( $program['otherFields'] as $field => $value ) {
								if( in_array( $field, $options['otherfields_visible'] ) ) {
									echo '<p class="otherField otherField-' . str_replace( ':', '-', $field ) . '">' . $value . '</p>';
								}
							}
						?>
					</div>
				</div>
				<div class="meta" style="grid-area: meta;">
					<?php
						// TODO: Kompassi: List meta fields to show
						foreach( array( 'times', 'cachedHosts' ) as $key ) {
							$value = '';
							if( isset( $program[$key] ) ) {
								$value = $program[$key];
								if( is_array( $value ) ) {
									$value = implode( ',', $value );
								}
							} else {
								// TODO: #11 - Get directly from Kompassi?
								if( 'times' == $key ) {
									$offset = get_option( 'gmt_offset' ) * 60 * 60;
									$value = date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $program['start'] + $offset );
									$value .= ' – ';
									if( date_i18n( 'Ymd', $program['start'] + $offset ) == date_i18n( 'Ymd', $program['end'] + $offset ) ) {
										$value .= date_i18n( get_option( 'time_format' ), $program['end'] + $offset );
									} else {
										// If multiday, show both days
										$value .= date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $program['end'] + $offset );
									}
									$value .= ' <span class="length">';
									$h = $program['length'] / 60;
									$min = $program['length'] % 60;
									if( $h < 1 ) {
										$value .= $min . 'min';
									} elseif( $min == 0 ) {
										$value .= floor( $h ) . 'h';
									} else {
										$value .= floor( $h ) . 'h ' . $min . 'min';
									}
									$value .= '</span>';
								}
							}
							if( isset( $value ) ) {
								echo '<div class="' . $key . '">' . $value . '</div>';
							}
						}
					?>
					<?php
						// Traverse through dimensions
						foreach( $program['cachedDimensions'] as $dimension => $values ) {
							if( !$options['dimensions'][$dimension]['flags']['isShownInDetail'] ) {
								continue;
							}

							if( in_array( $dimension, $options['hidden_dimensions'] ) ) {
								continue;
							}

							echo '<div class="dimension ' . $dimension . '">';
							foreach( $values as $slug ) {
								if( isset( $options['dimensions'][$dimension]['value_labels'][$slug] ) ) {
									echo '<span class="value">' . $options['dimensions'][$dimension]['value_labels'][$slug] . '</span> ';
								} else {
									echo '<span class="value">' . $slug . '</span> ';
								}
							}
							echo '</div>';
						}
					?>
				</div>
				<?php
					echo '<div class="actions" style="grid-area: actions;">';
					foreach( $program['links'] as $link ) {
						$class = strtolower( $link['type'] );
						if( in_array( strtolower( $link['type'] ), $this->icons ) ) {
							$class .= ' kompassi-icon-' . strtolower( $link['type'] );
						}
						echo '<a href="' . $link['href'] . '" class="' . $class . '" title="' . $link['title'] . '"></a>';
					}
					echo '</div>';
				?>
			</article>
		<?php
		return ob_get_clean( );
	}

	/**
	 *  Sorts program by event starting time
	 *  Callable function for usort()
	 */

	function sort_by_starting_time( $a, $b ) {
		if( $a['start_timestamp'] > $b['start_timestamp'] ) {
			return 1;
		} elseif( $b['start_timestamp'] > $a['start_timestamp'] ) {
			return -1;
		} else {
			return 0;
		}
	}

	/**
	 *  Returns a "Data provided by Kompassi" image
	 *
	 */

	function data_provided_image( ) {
		return '<div class="kompassi_provided"><a href="https://kompassi.eu/"><img src="' . plugins_url( '/images/kompassi_provided.svg', __FILE__ ) . '" alt="Data provided by Kompassi" /></a></div>';
	}
}

new WP_Plugin_Kompassi_Integration( );
