-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2025 at 05:20 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `config_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `config_tbl`
--

CREATE TABLE `config_tbl` (
  `id` int(11) NOT NULL,
  `node_name` varchar(8) NOT NULL DEFAULT 'usher01',
  `ctrlip` varchar(15) NOT NULL DEFAULT '192.168.10.200',
  `ctrlport` int(11) NOT NULL DEFAULT 3000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `config_tbl`
--

INSERT INTO `config_tbl` (`id`, `node_name`, `ctrlip`, `ctrlport`) VALUES
(1, 'usher01', '192.168.10.200', 3000);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `config_tbl`
--
ALTER TABLE `config_tbl`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `config_tbl`
--
ALTER TABLE `config_tbl`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
