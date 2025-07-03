import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ObjectRelatedItems, RelatedObjects } from '../wsi-proxy-api/related-items/data.model';
import { RelatedItemsService } from './related-items.service';

/* eslint-disable @typescript-eslint/naming-convention */

// const relatedObjectsEmpty: RelatedObjects = {
//   "Id": 2402900,
//   "Error": "relateditems_missing_input",
//   "Details": "Object ids are missing"
// };

const relatedObjectsDoNotExist: RelatedObjects = {
  RelatedResults: [
    {
      ObjectId: 'abc',
      ErrorCode: 1,
      RelatedItems: []
    },
    {
      ObjectId: '123',
      ErrorCode: 1,
      RelatedItems: []
    }
  ]
};

const relatedObjectsGood: RelatedObjects = {
  RelatedResults: [
    {
      ObjectId: 'GmsDevice_1_51531_4194309',
      ErrorCode: 0,
      RelatedItems: [
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NewRemoteNotification',
              Descriptor: 'New Remote Notification',
              Designation: 'System1.ManagementView:ManagementView.SystemSettings.RelatedItemsTemplates.NewRemoteNotification',
              ObjectId: 'System1:ManagementView_SystemSettings_RelatedItemsTemplates_NewRemoteNotification',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'StatusPropagation.AggregatedSummaryStatus',
                ObjectId: 'System1:ManagementView_SystemSettings_RelatedItemsTemplates_NewRemoteNotification',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Applications',
                SubDisciplineId: 1,
                TypeDescriptor: 'Operating Procedure',
                TypeId: 5500,
                SubTypeDescriptor: 'Remote Notification',
                SubTypeId: 5501,
                ManagedType: 110,
                ManagedTypeName: 'NewRemoteNotification',
                ObjectModelName: 'GMS_NewRemoteNotification',
                FunctionName: undefined!,
                Alias: undefined!
                // ValidationRules: {
                //   CommentRule: "Optional",
                //   ReAuthentication: "NoNeed",
                //   Configuration: 0,
                //   IsFourEyesEnabled: false,
                //   _links: []
                // }
              }
              // "Location": "System1.Management View:Project.System Settings.Related Items Templates.New Remote Notification",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253AManagementView_SystemSettings_RelatedItemsTemplates_NewRemoteNotification?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 13,
              ViewType: 0,
              Name: 'HQ_ActiveEvents',
              Descriptor: 'Active Events',
              Designation: 'System1.Site_User_View_Example:Site.Applications.Reports.Event.HQ_ActiveEvents',
              ObjectId: 'System1:0c517e8f_c16d_4f20_9397_4cd4b4d58261',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:0c517e8f_c16d_4f20_9397_4cd4b4d58261',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
              //   "ValidationRules": {
              //     "CommentRule": "Optional",
              //     "ReAuthentication": "NoNeed",
              //     "Configuration": 0,
              //     "IsFourEyesEnabled": false,
              //     "_links": []
              //   }
              }
              // "Location": "System1.Site_User_View_Example:Site_User_View_Example.Applications.Reports.Event.Active Events",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253A0c517e8f_c16d_4f20_9397_4cd4b4d58261?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            },
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 10,
              ViewType: 0,
              Name: 'HQ_ActiveEvents',
              Descriptor: 'Active Events',
              Designation: 'System1.ApplicationView:ApplicationView.Reports.Event.HQ_ActiveEvents',
              ObjectId: 'System1:0c517e8f_c16d_4f20_9397_4cd4b4d58261',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:0c517e8f_c16d_4f20_9397_4cd4b4d58261',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Application View:Applications.Reports.Event.Active Events",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253A0c517e8f_c16d_4f20_9397_4cd4b4d58261?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 13,
              ViewType: 0,
              Name: 'HQ_EventDetailsLog',
              Descriptor: 'Event Details Log',
              Designation: 'System1.Site_User_View_Example:Site.Applications.Reports.Event.HQ_EventDetailsLog',
              ObjectId: 'System1:de30bf01_7d0d_4db5_8b0e_ef092bdf863f',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:de30bf01_7d0d_4db5_8b0e_ef092bdf863f',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Site_User_View_Example:Site_User_View_Example.Applications.Reports.Event.Event Details Log",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253Ade30bf01_7d0d_4db5_8b0e_ef092bdf863f?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            },
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 10,
              ViewType: 0,
              Name: 'HQ_EventDetailsLog',
              Descriptor: 'Event Details Log',
              Designation: 'System1.ApplicationView:ApplicationView.Reports.Event.HQ_EventDetailsLog',
              ObjectId: 'System1:de30bf01_7d0d_4db5_8b0e_ef092bdf863f',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:de30bf01_7d0d_4db5_8b0e_ef092bdf863f',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Application View:Applications.Reports.Event.Event Details Log",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253Ade30bf01_7d0d_4db5_8b0e_ef092bdf863f?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 13,
              ViewType: 0,
              Name: 'HQ_UnprocessedEvents',
              Descriptor: 'Unprocessed Events',
              Designation: 'System1.Site_User_View_Example:Site.Applications.Reports.Event.HQ_UnprocessedEvents',
              ObjectId: 'System1:74dd7340_9674_4905_898f_736cdc06f93b',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:74dd7340_9674_4905_898f_736cdc06f93b',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Site_User_View_Example:Site_User_View_Example.Applications.Reports.Event.Unprocessed Events",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253A74dd7340_9674_4905_898f_736cdc06f93b?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            },
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 10,
              ViewType: 0,
              Name: 'HQ_UnprocessedEvents',
              Descriptor: 'Unprocessed Events',
              Designation: 'System1.ApplicationView:ApplicationView.Reports.Event.HQ_UnprocessedEvents',
              ObjectId: 'System1:74dd7340_9674_4905_898f_736cdc06f93b',
              Location: '',
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:74dd7340_9674_4905_898f_736cdc06f93b',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Application View:Applications.Reports.Event.Unprocessed Events",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253A74dd7340_9674_4905_898f_736cdc06f93b?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 13,
              ViewType: 0,
              Name: 'HQ_ObjectsStatus',
              Descriptor: 'Objects Status',
              Designation: 'System1.Site_User_View_Example:Site.Applications.Reports.Status.HQ_ObjectsStatus',
              ObjectId: 'System1:f15e8c20_f473_496a_8bad_60e5e89f5b8f',
              Location: '',
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:f15e8c20_f473_496a_8bad_60e5e89f5b8f',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: '',
                Alias: ''
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Site_User_View_Example:Site_User_View_Example.Applications.Reports.Status.Objects Status",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253Af15e8c20_f473_496a_8bad_60e5e89f5b8f?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            },
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 10,
              ViewType: 0,
              Name: 'HQ_ObjectsStatus',
              Descriptor: 'Objects Status',
              Designation: 'System1.ApplicationView:ApplicationView.Reports.Status.HQ_ObjectsStatus',
              ObjectId: 'System1:f15e8c20_f473_496a_8bad_60e5e89f5b8f',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:f15e8c20_f473_496a_8bad_60e5e89f5b8f',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Application View:Applications.Reports.Status.Objects Status",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253Af15e8c20_f473_496a_8bad_60e5e89f5b8f?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 10,
              ViewType: 0,
              Name: 'NA_Application_Subpoint_Report',
              Descriptor: 'TEC Subpoint Report',
              Designation: 'System1.ApplicationView:ApplicationView.Reports.Status.NA_Application_Subpoint_Report',
              ObjectId: 'System1:bfc20e24_746e_4e31_80cd_5358a3f35bc4',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'LastRuntime',
                ObjectId: 'System1:bfc20e24_746e_4e31_80cd_5358a3f35bc4',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 13,
                ManagedTypeName: 'ReportDefinition',
                ObjectModelName: 'GMS_ReportDefinition',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Application View:Applications.Reports.Status.TEC Subpoint Report",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253Abfc20e24_746e_4e31_80cd_5358a3f35bc4?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: '',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NewReport',
              Descriptor: 'New Report',
              Designation: 'System1.ManagementView:ManagementView.SystemSettings.RelatedItemsTemplates.NewReport',
              ObjectId: 'System1:NewReport',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'StatusPropagation.AggregatedSummaryStatus',
                ObjectId: 'System1:NewReport',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Report',
                TypeId: 6200,
                SubTypeDescriptor: 'Unassigned',
                SubTypeId: 0,
                ManagedType: 52,
                ManagedTypeName: 'NewReport',
                ObjectModelName: 'GMS_NewReport',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.System Settings.Related Items Templates.New Report",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253ANewReport?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: 'GmsDevice_1_51531_62914561',
          Reference: '',
          Mode: 2,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NC_1',
              Descriptor: 'Notification Class 1',
              Designation: 'System1.ManagementView:ManagementView.FieldNetworks.BACnetNetwork1.Hardware.Mike_51531.Local_IO.NC_1',
              ObjectId: 'System1:GmsDevice_1_51531_62914561',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'Notification_Class',
                ObjectId: 'System1:GmsDevice_1_51531_62914561',
                DisciplineDescriptor: 'Building Automation',
                DisciplineId: 50,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Notification Element',
                TypeId: 5300,
                SubTypeDescriptor: 'Notification Class',
                SubTypeId: 5302,
                ManagedType: 53,
                ManagedTypeName: 'BACnet Notification Class',
                ObjectModelName: 'GMS_BACNET_EO_BA_NC_1',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.Field Networks.BACnet Network 1.Hardware.Simulator Device 51531.Local_IO.Notification Class 1",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253AGmsDevice_1_51531_62914561?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: 'GmsDevice_1_51531_62914562',
          Reference: '',
          Mode: 2,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NC_2',
              Descriptor: 'Notification Class 2',
              Designation: 'System1.ManagementView:ManagementView.FieldNetworks.BACnetNetwork1.Hardware.Mike_51531.Local_IO.NC_2',
              ObjectId: 'System1:GmsDevice_1_51531_62914562',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'Notification_Class',
                ObjectId: 'System1:GmsDevice_1_51531_62914562',
                DisciplineDescriptor: 'Building Automation',
                DisciplineId: 50,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Notification Element',
                TypeId: 5300,
                SubTypeDescriptor: 'Notification Class',
                SubTypeId: 5302,
                ManagedType: 53,
                ManagedTypeName: 'BACnet Notification Class',
                ObjectModelName: 'GMS_BACNET_EO_BA_NC_1',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.Field Networks.BACnet Network 1.Hardware.Simulator Device 51531.Local_IO.Notification Class 2",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253AGmsDevice_1_51531_62914562?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: 'GmsDevice_1_51531_62914563',
          Reference: '',
          Mode: 2,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NC_3',
              Descriptor: 'Notification Class 3',
              Designation: 'System1.ManagementView:ManagementView.FieldNetworks.BACnetNetwork1.Hardware.Mike_51531.Local_IO.NC_3',
              ObjectId: 'System1:GmsDevice_1_51531_62914563',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'Notification_Class',
                ObjectId: 'System1:GmsDevice_1_51531_62914563',
                DisciplineDescriptor: 'Building Automation',
                DisciplineId: 50,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Notification Element',
                TypeId: 5300,
                SubTypeDescriptor: 'Notification Class',
                SubTypeId: 5302,
                ManagedType: 53,
                ManagedTypeName: 'BACnet Notification Class',
                ObjectModelName: 'GMS_BACNET_EO_BA_NC_1',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.Field Networks.BACnet Network 1.Hardware.Simulator Device 51531.Local_IO.Notification Class 3",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253AGmsDevice_1_51531_62914563?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: 'GmsDevice_1_51531_62914564',
          Reference: '',
          Mode: 2,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NC_4',
              Descriptor: 'Notification Class 4',
              Designation: 'System1.ManagementView:ManagementView.FieldNetworks.BACnetNetwork1.Hardware.Mike_51531.Local_IO.NC_4',
              ObjectId: 'System1:GmsDevice_1_51531_62914564',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'Notification_Class',
                ObjectId: 'System1:GmsDevice_1_51531_62914564',
                DisciplineDescriptor: 'Building Automation',
                DisciplineId: 50,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Notification Element',
                TypeId: 5300,
                SubTypeDescriptor: 'Notification Class',
                SubTypeId: 5302,
                ManagedType: 53,
                ManagedTypeName: 'BACnet Notification Class',
                ObjectModelName: 'GMS_BACNET_EO_BA_NC_1',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.Field Networks.BACnet Network 1.Hardware.Simulator Device 51531.Local_IO.Notification Class 4",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253AGmsDevice_1_51531_62914564?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: 'GmsDevice_1_51531_62914565',
          Reference: '',
          Mode: 2,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NC_5',
              Descriptor: 'Notification Class 5',
              Designation: 'System1.ManagementView:ManagementView.FieldNetworks.BACnetNetwork1.Hardware.Mike_51531.Local_IO.NC_5',
              ObjectId: 'System1:GmsDevice_1_51531_62914565',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'Notification_Class',
                ObjectId: 'System1:GmsDevice_1_51531_62914565',
                DisciplineDescriptor: 'Building Automation',
                DisciplineId: 50,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Notification Element',
                TypeId: 5300,
                SubTypeDescriptor: 'Notification Class',
                SubTypeId: 5302,
                ManagedType: 53,
                ManagedTypeName: 'BACnet Notification Class',
                ObjectModelName: 'GMS_BACNET_EO_BA_NC_1',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.Field Networks.BACnet Network 1.Hardware.Simulator Device 51531.Local_IO.Notification Class 5",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253AGmsDevice_1_51531_62914565?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        },
        {
          ItemDescriptor: '',
          Parameter: 'New Trend',
          Reference: '',
          Mode: 1,
          SourceType: 3,
          Nodes: [
            {
              HasChild: false,
              SystemId: 1,
              ViewId: 9,
              ViewType: 0,
              Name: 'NewTrend',
              Descriptor: 'New Trend',
              Designation: 'System1.ManagementView:ManagementView.SystemSettings.RelatedItemsTemplates.NewTrend',
              ObjectId: 'System1:NewTrend',
              Location: undefined!,
              Attributes: {
                DefaultProperty: 'StatusPropagation.AggregatedSummaryStatus',
                ObjectId: 'System1:NewTrend',
                DisciplineDescriptor: 'Management System',
                DisciplineId: 0,
                SubDisciplineDescriptor: 'Unassigned',
                SubDisciplineId: 0,
                TypeDescriptor: 'Trend',
                TypeId: 7400,
                SubTypeDescriptor: 'View',
                SubTypeId: 7405,
                ManagedType: 96,
                ManagedTypeName: 'NewTrend',
                ObjectModelName: '_GmsNewTrend',
                FunctionName: undefined!,
                Alias: undefined!
                // "ValidationRules": {
                //   "CommentRule": "Optional",
                //   "ReAuthentication": "NoNeed",
                //   "Configuration": 0,
                //   "IsFourEyesEnabled": false,
                //   "_links": []
                // }
              }
              // "Location": "System1.Management View:Project.System Settings.Related Items Templates.New Trend",
              // "_links": [
              //   {
              //     "Rel": "properties",
              //     "Href": "api/properties/System1%253ANewTrend?requestType=0",
              //     "IsTemplated": false
              //   }
              // ]
            }
          ]
        }
      ]
    }
  ]
};

class RouterStub {}
// local variables

// Tests  /////////////
describe('Related Items Service:', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: HttpClient, useClass: HttpClient },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: 'productSettingFilePath', useValue: 'noMatter' },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        AuthenticationServiceBase,
        RelatedItemsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create RelatedItemsService',
    inject([RelatedItemsService], (relatedItemsService: RelatedItemsService) => {
      expect(relatedItemsService instanceof RelatedItemsService).toBe(true);
    }
    ));

  // it("should call getRelatedItems",
  //   inject([HttpTestingController, RelatedItemsService], (httpTestingController: HttpTestingController, relatedItemsService: RelatedItemsService) => {
  //   expect(relatedItemsService.getRelatedItems(["objectId1"]).
  //   subscribe(
  //     (data: RelatedObjects) => expect(data).toEqual(relatedObjectsEmpty))
  //   );

  // const req: TestRequest = httpTestingController.expectOne(data => data.method === "POST" && data.url === "protocol://site:port/host/api/relateditems/");

  //   req.flush("body");
  //   httpTestingController.verify();
  //   }));

  // it("verify that getRelatedItems works", fakeAsync(() => {
  //   relatedItemsService.getRelatedItems(["propertyId1", "propertyId2"]);

  //   // getRelatedItems service should have made one request to POST getRelatedItems
  //   // workaround provided by https://github.com/angular/angular/issues/19974
  //   // since there is a open Issue related to httpClient with params
  //   const req: TestRequest =
  //   httpTestingController.expectOne( data => data.method === "POST" && data.url === "protocol://site:port/host/api/commands/");

  //   // Expect server to return the ExecuteCommand after GET
  //   const expectedResponse: HttpResponse<any> = new HttpResponse(
  //     { status: 200, statusText: "OK", body: body });
  //   req.event(expectedResponse);

  //   req.flush(body);
  //   httpTestingController.verify();
});

/* eslint-enable @typescript-eslint/naming-convention */
