USE [master]
GO
/****** Object:  Database [EventureDB]    Script Date: 4/20/2025 5:48:12 PM ******/
CREATE DATABASE [EventureDB]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'EventureDB', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\EventureDB.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'EventureDB_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\EventureDB_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [EventureDB] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [EventureDB].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [EventureDB] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [EventureDB] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [EventureDB] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [EventureDB] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [EventureDB] SET ARITHABORT OFF 
GO
ALTER DATABASE [EventureDB] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [EventureDB] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [EventureDB] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [EventureDB] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [EventureDB] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [EventureDB] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [EventureDB] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [EventureDB] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [EventureDB] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [EventureDB] SET  ENABLE_BROKER 
GO
ALTER DATABASE [EventureDB] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [EventureDB] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [EventureDB] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [EventureDB] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [EventureDB] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [EventureDB] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [EventureDB] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [EventureDB] SET RECOVERY FULL 
GO
ALTER DATABASE [EventureDB] SET  MULTI_USER 
GO
ALTER DATABASE [EventureDB] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [EventureDB] SET DB_CHAINING OFF 
GO
ALTER DATABASE [EventureDB] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [EventureDB] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [EventureDB] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [EventureDB] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'EventureDB', N'ON'
GO
ALTER DATABASE [EventureDB] SET QUERY_STORE = ON
GO
ALTER DATABASE [EventureDB] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [EventureDB]
GO

CREATE LOGIN [eventuredb_user] 
WITH PASSWORD = 'StrongP@ssword123'; 
/****** Object:  User [eventuredb_user]    Script Date: 4/20/2025 5:48:13 PM ******/
CREATE USER [eventuredb_user] FOR LOGIN [eventuredb_user] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_owner] ADD MEMBER [eventuredb_user]
GO
/****** Object:  Table [dbo].[Ads]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Ads](
	[AdID] [int] IDENTITY(1,1) NOT NULL,
	[CompanyID] [int] NULL,
	[AdContent] [nvarchar](max) NOT NULL,
	[TargetCategory] [nvarchar](100) NULL,
	[TargetLocation] [nvarchar](255) NULL,
	[StartDate] [datetime] NOT NULL,
	[EndDate] [datetime] NOT NULL,
	[AdCost] [decimal](10, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[AdID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Bookings]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Bookings](
	[BookingID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[EventID] [int] NOT NULL,
	[BookingDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[BookingID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_User_Event_Booking] UNIQUE NONCLUSTERED 
(
	[UserID] ASC,
	[EventID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Categories]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Categories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EventCategories]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EventCategories](
	[EventID] [int] NOT NULL,
	[CategoryID] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[EventID] ASC,
	[CategoryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EventImages]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EventImages](
	[ImageID] [int] IDENTITY(1,1) NOT NULL,
	[EventID] [int] NULL,
	[ImageURL] [nvarchar](255) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ImageID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Events]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Events](
	[EventID] [int] IDENTITY(1,1) NOT NULL,
	[CompanyID] [int] NULL,
	[Title] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](max) NOT NULL,
	[Location] [nvarchar](255) NOT NULL,
	[Price] [decimal](10, 2) NULL,
	[StartDate] [datetime] NOT NULL,
	[EndDate] [datetime] NOT NULL,
	[MaxAttendees] [int] NULL,
	[CreatedAt] [datetime] NULL,
	[Currency] [nvarchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[EventID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Filters]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Filters](
	[FilterID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Category] [nvarchar](100) NULL,
	[Location] [nvarchar](255) NULL,
	[MinPrice] [decimal](10, 2) NULL,
	[MaxPrice] [decimal](10, 2) NULL,
	[MinRating] [int] NULL,
	[StartDate] [datetime] NULL,
	[EndDate] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[FilterID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MapsIntegration]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MapsIntegration](
	[MapID] [int] IDENTITY(1,1) NOT NULL,
	[EventID] [int] NULL,
	[Latitude] [decimal](9, 6) NOT NULL,
	[Longitude] [decimal](9, 6) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MapID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Payments]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Payments](
	[PaymentID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[EventID] [int] NOT NULL,
	[PaymentMethod] [varchar](50) NOT NULL,
	[Amount] [decimal](10, 2) NOT NULL,
	[PaymentStatus] [varchar](20) NULL,
	[TransactionDate] [datetime] NULL,
	[Currency] [nvarchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[PaymentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Recommendations]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Recommendations](
	[RecommendationID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[EventID] [int] NOT NULL,
	[RecommendedOn] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[RecommendationID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_User_Event] UNIQUE NONCLUSTERED 
(
	[UserID] ASC,
	[EventID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RefreshTokens]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RefreshTokens](
	[TokenID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NOT NULL,
	[Token] [nvarchar](255) NOT NULL,
	[ExpiresAt] [datetime] NOT NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[TokenID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reports]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reports](
	[ReportID] [int] IDENTITY(1,1) NOT NULL,
	[ReporterID] [int] NOT NULL,
	[ReportedUserID] [int] NULL,
	[ReportedEventID] [int] NULL,
	[ReportReason] [nvarchar](255) NOT NULL,
	[ReportDetails] [nvarchar](max) NULL,
	[ReportDate] [datetime] NULL,
	[Status] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[ReportID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reviews]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reviews](
	[ReviewID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[EventID] [int] NOT NULL,
	[Rating] [int] NULL,
	[ReviewText] [nvarchar](max) NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[ReviewID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SearchHistory]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SearchHistory](
	[SearchID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[SearchQuery] [nvarchar](255) NOT NULL,
	[SearchType] [nvarchar](50) NOT NULL,
	[SearchedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[SearchID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 4/20/2025 5:48:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	[FullName] [nvarchar](255) NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[PasswordHash] [varbinary](max) NOT NULL,
	[UserType] [nvarchar](20) NOT NULL,
	[ProfilePicture] [nvarchar](255) NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IDX_RefreshTokens_Token]    Script Date: 4/20/2025 5:48:13 PM ******/
CREATE NONCLUSTERED INDEX [IDX_RefreshTokens_Token] ON [dbo].[RefreshTokens]
(
	[Token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_RefreshTokens_UserID]    Script Date: 4/20/2025 5:48:13 PM ******/
CREATE NONCLUSTERED INDEX [IDX_RefreshTokens_UserID] ON [dbo].[RefreshTokens]
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_Reviews_EventID]    Script Date: 4/20/2025 5:48:13 PM ******/
CREATE NONCLUSTERED INDEX [IDX_Reviews_EventID] ON [dbo].[Reviews]
(
	[EventID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_SearchHistory_UserID]    Script Date: 4/20/2025 5:48:13 PM ******/
CREATE NONCLUSTERED INDEX [IDX_SearchHistory_UserID] ON [dbo].[SearchHistory]
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IDX_Users_Email]    Script Date: 4/20/2025 5:48:13 PM ******/
CREATE NONCLUSTERED INDEX [IDX_Users_Email] ON [dbo].[Users]
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT (getdate()) FOR [BookingDate]
GO
ALTER TABLE [dbo].[Events] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Events] ADD  DEFAULT ('USD') FOR [Currency]
GO
ALTER TABLE [dbo].[Payments] ADD  DEFAULT (getdate()) FOR [TransactionDate]
GO
ALTER TABLE [dbo].[Payments] ADD  DEFAULT ('USD') FOR [Currency]
GO
ALTER TABLE [dbo].[Recommendations] ADD  DEFAULT (getdate()) FOR [RecommendedOn]
GO
ALTER TABLE [dbo].[RefreshTokens] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Reports] ADD  DEFAULT (getdate()) FOR [ReportDate]
GO
ALTER TABLE [dbo].[Reports] ADD  DEFAULT ('Pending') FOR [Status]
GO
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[SearchHistory] ADD  DEFAULT (getdate()) FOR [SearchedAt]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Ads]  WITH CHECK ADD FOREIGN KEY([CompanyID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Bookings]  WITH CHECK ADD  CONSTRAINT [FK_Bookings_Events] FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
GO
ALTER TABLE [dbo].[Bookings] CHECK CONSTRAINT [FK_Bookings_Events]
GO
ALTER TABLE [dbo].[Bookings]  WITH CHECK ADD  CONSTRAINT [FK_Bookings_Users] FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Bookings] CHECK CONSTRAINT [FK_Bookings_Users]
GO
ALTER TABLE [dbo].[EventCategories]  WITH CHECK ADD FOREIGN KEY([CategoryID])
REFERENCES [dbo].[Categories] ([CategoryID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[EventCategories]  WITH CHECK ADD FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[EventImages]  WITH CHECK ADD FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Events]  WITH CHECK ADD FOREIGN KEY([CompanyID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Filters]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MapsIntegration]  WITH CHECK ADD FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD  CONSTRAINT [FK_Payments_Events] FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
GO
ALTER TABLE [dbo].[Payments] CHECK CONSTRAINT [FK_Payments_Events]
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD  CONSTRAINT [FK_Payments_Users] FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Payments] CHECK CONSTRAINT [FK_Payments_Users]
GO
ALTER TABLE [dbo].[Recommendations]  WITH CHECK ADD  CONSTRAINT [FK_Recommendations_Events] FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
GO
ALTER TABLE [dbo].[Recommendations] CHECK CONSTRAINT [FK_Recommendations_Events]
GO
ALTER TABLE [dbo].[Recommendations]  WITH CHECK ADD  CONSTRAINT [FK_Recommendations_Users] FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Recommendations] CHECK CONSTRAINT [FK_Recommendations_Users]
GO
ALTER TABLE [dbo].[RefreshTokens]  WITH CHECK ADD  CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[RefreshTokens] CHECK CONSTRAINT [FK_RefreshTokens_Users]
GO
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_ReportedEvent] FOREIGN KEY([ReportedEventID])
REFERENCES [dbo].[Events] ([EventID])
GO
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_ReportedEvent]
GO
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_ReportedUser] FOREIGN KEY([ReportedUserID])
REFERENCES [dbo].[Users] ([UserID])
GO
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_ReportedUser]
GO
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_Reporter] FOREIGN KEY([ReporterID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_Reporter]
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD  CONSTRAINT [FK_Reviews_Events] FOREIGN KEY([EventID])
REFERENCES [dbo].[Events] ([EventID])
GO
ALTER TABLE [dbo].[Reviews] CHECK CONSTRAINT [FK_Reviews_Events]
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD  CONSTRAINT [FK_Reviews_Users] FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Reviews] CHECK CONSTRAINT [FK_Reviews_Users]
GO
ALTER TABLE [dbo].[SearchHistory]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Events]  WITH CHECK ADD  CONSTRAINT [CHK_ValidCurrency] CHECK  (([Currency]='AUD' OR [Currency]='CAD' OR [Currency]='GBP' OR [Currency]='EUR' OR [Currency]='LBP' OR [Currency]='USD'))
GO
ALTER TABLE [dbo].[Events] CHECK CONSTRAINT [CHK_ValidCurrency]
GO
ALTER TABLE [dbo].[Events]  WITH CHECK ADD CHECK  (([Price]>=(0)))
GO
ALTER TABLE [dbo].[Filters]  WITH CHECK ADD CHECK  (([MinRating]>=(1) AND [MinRating]<=(5)))
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD CHECK  (([PaymentStatus]='Failed' OR [PaymentStatus]='Completed' OR [PaymentStatus]='Pending'))
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD CHECK  (([Rating]>=(1) AND [Rating]<=(5)))
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD CHECK  (([UserType]='Individual' OR [UserType]='Company' OR [UserType]='Admin'))
GO
USE [master]
GO
ALTER DATABASE [EventureDB] SET  READ_WRITE 
GO

CREATE TABLE Friends (
    recordID INT Indetity(1,1) PRIMARY KEY,
    userID INT NOT NULL,
    friendID INT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (userID) REFERENCES Users(UserID),
    CONSTRAINT fk_friend FOREIGN KEY (friendID) REFERENCES Users(UserID),
    CONSTRAINT chk_not_same CHECK (userID <> friendID)
);

CREATE TABLE MajorCategories (
	CatID INT Primary key Identity(1,1),
    CatName varchar(50) not null unique
	Icon nvarchar(255) not null default 'fa-object-group';
);

CREATE TABLE GroupedCategories (
    MajorCatID INT NOT NULL,
    CatID INT NOT NULL,
    CONSTRAINT PK_MajorCategories PRIMARY KEY (MajorCatID, CatID),
    CONSTRAINT FK_MajorCategories_MajorCatID FOREIGN KEY (MajorCatID) REFERENCES MajorCategories(CatID),
    CONSTRAINT FK_MajorCategories_CatID FOREIGN KEY (CatID) REFERENCES Categories(CategoryID)
);

insert into MajorCategories (CatName, Icon) values 
('Arts & Culture', 'fa-palette'), ('Entertainment & Music', 'fa-icons'),
('Sports & Outdoors', 'fa-basketball'), ('Food & Lifestyle', 'fa-utensils'),
('Education & Learning', 'fa-graduation-cap'), ('Spiritual & Religious', 'fa-place-of-worship'),
('Family & Kids', 'fa-people-roof');

insert into Categories (Name) values 
('Exhibition'), ('Concert'), ('Sports'),
('Nature'), ('Hisotry'), ('Relgion'),
('Hiking'), ('Party'), ('Food'),
('Music'), ('Theater'), ('Art'),
('Movies'), ('Caving'), ('Camping'),
('For Adults'), ('For Kids'), ('Trivia'),
('Board Games'), ('Seminar'), ('Workshop'),
('Gaming'), ('Fashion'), ('Festival')

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(1, (SELECT CategoryID FROM Categories WHERE Name = 'Exhibition')),
(1, (SELECT CategoryID FROM Categories WHERE Name = 'Art')),
(1, (SELECT CategoryID FROM Categories WHERE Name = 'Theater')),
(1, (SELECT CategoryID FROM Categories WHERE Name = 'Movies')),
(1, (SELECT CategoryID FROM Categories WHERE Name = 'History'));

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(2, (SELECT CategoryID FROM Categories WHERE Name = 'Concert')),
(2, (SELECT CategoryID FROM Categories WHERE Name = 'Music')),
(2, (SELECT CategoryID FROM Categories WHERE Name = 'Party')),
(2, (SELECT CategoryID FROM Categories WHERE Name = 'Trivia')),
(2, (SELECT CategoryID FROM Categories WHERE Name = 'Gaming')),
(2, (SELECT CategoryID FROM Categories WHERE Name = 'Board Games'));

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(3, (SELECT CategoryID FROM Categories WHERE Name = 'Sports')),
(3, (SELECT CategoryID FROM Categories WHERE Name = 'Nature')),
(3, (SELECT CategoryID FROM Categories WHERE Name = 'Hiking')),
(3, (SELECT CategoryID FROM Categories WHERE Name = 'Caving')),
(3, (SELECT CategoryID FROM Categories WHERE Name = 'Camping'));

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(4, (SELECT CategoryID FROM Categories WHERE Name = 'Food')),
(4, (SELECT CategoryID FROM Categories WHERE Name = 'For Adults')),
(4, (SELECT CategoryID FROM Categories WHERE Name = 'Fashion'));

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(5, (SELECT CategoryID FROM Categories WHERE Name = 'Seminar')),
(5, (SELECT CategoryID FROM Categories WHERE Name = 'Workshop'));

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(6, (SELECT CategoryID FROM Categories WHERE Name = 'Religion'));

INSERT INTO GroupedCategories (MajorCatID, CatID) VALUES
(7, (SELECT CategoryID FROM Categories WHERE Name = 'For Kids'));

Alter table Users add PhoneNb varchar(20) default null;

CREATE TABLE Bookmarks (
    UserID INT NOT NULL,
    EventID INT NOT NULL,
    PRIMARY KEY (UserID, EventID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (EventID) REFERENCES Events(EventID)
);

CREATE TABLE Feedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    FeedbackText NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UserID INT NOT NULL,
    Checked BIT DEFAULT 0,
    CheckedAt DATETIME NULL,
    CONSTRAINT FK_Feedback_Users FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
);
