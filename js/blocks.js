var el = wp.element.createElement;
var __ = wp.i18n.__;
var _x = wp.i18n._x;

var icon = el( 'svg', { width: '24', height: '24' },
   el( 'path', {
      d: 'M9 87.404a.083.083 0 0 1-.077-.052L6.73 81.974l-2.51 1.36c-.079.042-.19-.07-.148-.15l1.359-2.51-5.378-2.192a.084.084 0 0 1 0-.155l5.378-2.193-1.359-2.51c-.043-.079.07-.191.149-.148l2.51 1.359 2.192-5.378a.084.084 0 0 1 .155 0l2.193 5.378 2.51-1.36c.079-.042.191.07.148.15l-1.359 2.51 5.378 2.192c.07.028.07.127 0 .155l-5.007 2.042 1.194 2.53a.368.368 0 0 1-.079.425.367.367 0 0 1-.429.077l-2.493-1.245-2.056 5.041a.083.083 0 0 1-.078.053zm4.465-4.524-1.906-4.037c-.233-.429-.45-.833-.633-1.178-.434-.814-1.222-1.446-2.229-1.302a2.005 2.005 0 0 0-.537.156l-.275.15c-.249.16-.461.372-.622.62l-.147.274a2.01 2.01 0 0 0-.158.542c-.122.865.336 1.552.978 2.015zM9.01 79.337a.933.933 0 0 1 0-1.865.933.933 0 0 1 0 1.865z',
      transform: 'matrix(1.33333 0 0 -1.33333 0 116.54)'
   } )
);

/**
 *  Schedule block
 *
 */

wp.blocks.registerBlockType(
   'kompassi-integration/schedule',
   {
      title: __( 'Program Schedule', 'kompassi-integration' ),
      category: 'kompassi',
      icon: icon,
      supports: {
         align: true,
         multiple: false
      },
      attributes: {
         showToolbar: { type: 'boolean', default: 'true' },
         showKonsti: { type: 'boolean', default: 'false' },
         eventSlug: { type: 'string', default: '' },
         defaultFilters: { type: 'string', default: '' },
         timelineGrouping: { type: 'string', default: '' },
         timetablePrimaryGrouping: { type: 'string', default: '' },
         timetableSecondaryGrouping: { type: 'string', default: '' },
      },
      edit: function( props ) {
         if( !props ) {
            return;
         }
         return( [
            el( wp.components.Placeholder, {
               icon: icon,
               label: __( 'Program Schedule', 'kompassi-integration' ),
            }, ''
            ),
            el( wp.blockEditor.InspectorControls, null,
               el( wp.components.PanelBody, { title: __( 'General', 'kompassi-integration' ) },
						el( wp.components.ToggleControl, {
                     label: __( 'Show Toolbar', 'kompassi-integration' ),
                     checked: props.attributes.showToolbar,
							onChange: function( value ) {
                        props.setAttributes( { showToolbar: !props.attributes.showToolbar } );
                     },
                  } ),
                  el( wp.components.ToggleControl, {
                     label: __( 'Show Konsti logo in footer', 'kompassi-integration' ),
                     checked: props.attributes.showKonsti,
                     onChange: function( value ) {
                        props.setAttributes( { showKonsti: !props.attributes.showKonsti } );
                     },
                     help: __( 'If your event uses Konsti for electronic sign-ups, it is highly recommended to show the Konsti logo in the footer.', 'kompassi-integration' ),
                  } ),
                  el( wp.components.TextControl, {
                     label: __( 'Event Technical Name', 'kompassi-integration' ),
                     value: props.attributes.eventSlug,
                     onChange: function( value ) {
                        props.setAttributes( { eventSlug: value } )
                     },
                     __next40pxDefaultSize: true,
                  } ),
               ),
               el( wp.components.PanelBody, { title: __( 'Defaults', 'kompassi-integration' ) },
                  el( wp.components.TextControl, {
                     label: __( 'Filters', 'kompassi-integration' ),
                     value: props.attributes.defaultFilters,
                     onChange: function( value ) {
                        props.setAttributes( { defaultFilters: value } )
                     },
                     help: __( 'To change the default values for text search, filters and display type when loading this page, insert the options here.', 'kompassi-integration' ),
                     __next40pxDefaultSize: true,
                  } ),
                  el( 'p', { },
                     el( 'span', { }, __( 'For example', 'kompassi-integration' ) + ': ' ),
                     el( 'br', { } ),
                     el( 'code', { }, 'language:fi/display:timeline' )
                  ),
               ),
               el( wp.components.PanelBody, { title: __( 'Timeline', 'kompassi-integration' ) },
                  el( wp.components.TextControl, {
                     label: __( 'Grouping Dimension', 'kompassi-integration' ),
                     value: props.attributes.timelineGrouping,
                     onChange: function( value ) {
                        props.setAttributes( { timelineGrouping: value } )
                     },
                     help: __( 'Programs will be grouped with subheadings based on the (first) dimension value in this dimension.', 'kompassi-integration' ),
                     __next40pxDefaultSize: true,
                  } ),
               ),
               el( wp.components.PanelBody, { title: __( 'Timetable', 'kompassi-integration' ) },
                  el( wp.components.TextControl, {
                     label: __( 'Primary Grouping Dimension', 'kompassi-integration' ),
                     value: props.attributes.timetablePrimaryGrouping,
                     onChange: function( value ) {
                        props.setAttributes( { timetablePrimaryGrouping: value } )
                     },
                     help: __( 'Programs will be grouped into tables based on the (first) dimension value in this dimension.', 'kompassi-integration' ),
                     __next40pxDefaultSize: true,
                  } ),
                  el( wp.components.TextControl, {
                     label: __( 'Secondary Grouping Dimension', 'kompassi-integration' ),
                     value: props.attributes.timetableSecondaryGrouping,
                     onChange: function( value ) {
                        props.setAttributes( { timetableSecondaryGrouping: value } )
                     },
                     help: __( 'Programs will be grouped into table columns based on the (first) dimension vlaue in this dimension.', 'kompassi-integration' ),
                     __next40pxDefaultSize: true,
                  } ),
               ),
				),
         ] );
      },
      save: function( props ) {
         return null;
      },
   }
);

/**
 *  Dimension list block
 *
 */

wp.blocks.registerBlockType(
   'kompassi-integration/dimension-list',
   {
      title: __( 'Program Dimension List', 'kompassi-integration' ),
      category: 'kompassi',
      icon: icon,
      supports: {
         align: true,
         multiple: false
      },
      attributes: {
         eventSlug: { type: 'string', default: '' },
      },
      edit: function( props ) {
         if( !props ) {
            return;
         }
         return( [
            el( wp.components.Placeholder, {
               icon: icon,
               label: __( 'Program Dimension List', 'kompassi-integration' ),
            }, ''
            ),
            el( wp.blockEditor.InspectorControls, null,
               el( wp.components.PanelBody, { title: __( 'Options', 'kompassi-integration' ) },
                  el( wp.components.PanelRow, null,
                     el( wp.components.TextControl, {
                        label: __( 'Event Technical Name', 'kompassi-integration' ),
                        value: props.attributes.eventSlug,
                        onChange: function( value ) {
                           props.setAttributes( { eventSlug: value } )
                        }
                     } ),
                  ),
					)
				),
         ] );
      },
      save: function( props ) {
         return null;
      },
   }
);
